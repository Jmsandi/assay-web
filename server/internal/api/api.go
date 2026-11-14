// Package api is the portal's HTTP API (/api/...), used by the React front end.
//
// Security:
//   - Sign-in sets an HttpOnly, SameSite=Lax session cookie; only its hash is stored.
//   - Every state-changing request must come from the portal's own origin (Origin or
//     Sec-Fetch-Site), which blocks cross-site request forgery.
//   - Sign-up and sign-in are rate limited per client address; a missing account and a
//     wrong password look the same, and take the same time.
//   - Roles decide who may change keys; live keys need an approved organisation.
//   - API keys are passed through once on creation and never stored here.
package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"net/mail"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/auth"
	"github.com/Jmsandi/assay-web/server/internal/core"
	"github.com/Jmsandi/assay-web/server/internal/store"
	"github.com/google/uuid"
)

const (
	sessionCookie = "assay_session"
	sessionTTL    = 14 * 24 * time.Hour
	// Test partners get a modest rate limit; live limits are set when approved.
	testRequestsPerMinute = 60
)

type Server struct {
	Store store.Store
	Core  core.API
	// Origin is the portal's public origin, e.g. https://portal.geneline-x.net.
	Origin string
	// SecureCookies is false only for local development over plain http.
	SecureCookies bool
	Now           func() time.Time
	limiter       *limiter
	once          sync.Once
}

func (s *Server) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

func (s *Server) Routes(mux *http.ServeMux) {
	s.once.Do(func() { s.limiter = newLimiter(10, time.Minute) })
	mux.HandleFunc("POST /api/auth/signup", s.guard(s.signup))
	mux.HandleFunc("POST /api/auth/login", s.guard(s.login))
	mux.HandleFunc("POST /api/auth/logout", s.guard(s.logout))
	mux.HandleFunc("GET /api/me", s.member(s.me))
	mux.HandleFunc("GET /api/keys", s.member(s.listKeys))
	mux.HandleFunc("POST /api/keys", s.guard(s.member(s.createKey)))
	mux.HandleFunc("DELETE /api/keys/{id}", s.guard(s.member(s.revokeKey)))
	mux.HandleFunc("GET /api/usage", s.member(s.usage))
	mux.HandleFunc("GET /api/activity", s.member(s.activity))
	mux.HandleFunc("/api/", func(w http.ResponseWriter, _ *http.Request) { fail(w, 404, "not_found") })
}

// ---- helpers ----

func fail(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code}})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		fail(w, 415, "json_required")
		return false
	}
	d := json.NewDecoder(io.LimitReader(r.Body, 16<<10))
	d.DisallowUnknownFields()
	if d.Decode(dst) != nil {
		fail(w, 400, "invalid_request")
		return false
	}
	return true
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// guard rejects state-changing requests that don't come from the portal itself.
func (s *Server) guard(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" {
			if origin != s.Origin {
				fail(w, 403, "cross_site_request")
				return
			}
		} else if site := r.Header.Get("Sec-Fetch-Site"); site != "" && site != "same-origin" {
			fail(w, 403, "cross_site_request")
			return
		}
		next(w, r)
	}
}

type member struct {
	User store.User
	Org  store.Organisation
	Role string
}

// member loads the signed-in user and their organisation, or answers 401.
func (s *Server) member(next func(http.ResponseWriter, *http.Request, member)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(sessionCookie)
		if err != nil || c.Value == "" {
			fail(w, 401, "signed_out")
			return
		}
		userID, err := s.Store.SessionUser(r.Context(), auth.HashToken(c.Value), s.now())
		if err != nil {
			fail(w, 401, "signed_out")
			return
		}
		user, err := s.Store.UserByID(r.Context(), userID)
		if err != nil {
			fail(w, 401, "signed_out")
			return
		}
		ms, err := s.Store.Memberships(r.Context(), userID)
		if err != nil || len(ms) == 0 {
			fail(w, 403, "no_organisation")
			return
		}
		next(w, r, member{User: user, Org: ms[0].Organisation, Role: ms[0].Role})
	}
}

func (m member) actor() string { return "user_" + strings.ReplaceAll(m.User.ID.String(), "-", "") }

func (m member) canManageKeys() bool {
	return slices.Contains([]string{"owner", "admin", "developer"}, m.Role)
}

func (s *Server) startSession(w http.ResponseWriter, r *http.Request, userID uuid.UUID) bool {
	token, hash, err := auth.NewSessionToken()
	if err == nil {
		err = s.Store.CreateSession(r.Context(), hash, userID, s.now().Add(sessionTTL))
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return false
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: token, Path: "/", HttpOnly: true, Secure: s.SecureCookies, SameSite: http.SameSiteLaxMode, MaxAge: int(sessionTTL.Seconds())})
	return true
}

// ---- auth ----

func (s *Server) signup(w http.ResponseWriter, r *http.Request) {
	if !s.limiter.allow("signup:" + clientIP(r)) {
		fail(w, 429, "rate_limited")
		return
	}
	var body struct {
		Name     string `json:"name"`
		Company  string `json:"company"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	body.Name, body.Company, body.Email = strings.TrimSpace(body.Name), strings.TrimSpace(body.Company), strings.TrimSpace(body.Email)
	if addr, err := mail.ParseAddress(body.Email); err != nil || addr.Address != body.Email || len(body.Email) > 254 {
		fail(w, 400, "invalid_email")
		return
	}
	if body.Name == "" || len(body.Name) > 100 || body.Company == "" || len(body.Company) > 120 {
		fail(w, 400, "invalid_request")
		return
	}
	if auth.ValidPassword(body.Password) != nil {
		fail(w, 400, "weak_password")
		return
	}
	if _, err := s.Store.UserByEmail(r.Context(), body.Email); err == nil {
		fail(w, 409, "email_taken")
		return
	}
	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	user := store.User{ID: uuid.New(), Email: body.Email, Name: body.Name, PasswordHash: hash}
	org := store.Organisation{ID: uuid.New(), Name: body.Company, PartnerID: newPartnerID()}
	// Core first: if it is down, nothing is created and the user can simply retry.
	if _, err = s.Core.UpsertPartner(r.Context(), "user_"+strings.ReplaceAll(user.ID.String(), "-", ""), org.PartnerID, "test", testRequestsPerMinute); err != nil {
		log.Printf("signup: core partner: %v", err)
		fail(w, 503, "unavailable")
		return
	}
	if err = s.Store.CreateAccount(r.Context(), user, org); err != nil {
		if errors.Is(err, store.ErrDuplicate) {
			fail(w, 409, "email_taken")
			return
		}
		fail(w, 503, "unavailable")
		return
	}
	if !s.startSession(w, r, user.ID) {
		return
	}
	writeJSON(w, 201, map[string]any{"user": map[string]string{"name": user.Name, "email": user.Email}})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if !s.limiter.allow("login:" + clientIP(r)) {
		fail(w, 429, "rate_limited")
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	user, err := s.Store.UserByEmail(r.Context(), strings.TrimSpace(body.Email))
	if err != nil {
		auth.DummyCheck(body.Password)
		fail(w, 401, "wrong_credentials")
		return
	}
	if !auth.CheckPassword(user.PasswordHash, body.Password) {
		fail(w, 401, "wrong_credentials")
		return
	}
	if !s.startSession(w, r, user.ID) {
		return
	}
	writeJSON(w, 200, map[string]any{"user": map[string]string{"name": user.Name, "email": user.Email}})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil && c.Value != "" {
		_ = s.Store.DeleteSession(r.Context(), auth.HashToken(c.Value))
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", HttpOnly: true, Secure: s.SecureCookies, SameSite: http.SameSiteLaxMode, MaxAge: -1})
	w.WriteHeader(204)
}

func (s *Server) me(w http.ResponseWriter, _ *http.Request, m member) {
	writeJSON(w, 200, map[string]any{
		"user":         map[string]string{"name": m.User.Name, "email": m.User.Email},
		"organisation": map[string]string{"name": m.Org.Name, "live_status": m.Org.LiveStatus, "role": m.Role},
	})
}

// ---- keys ----

func modeParam(r *http.Request) (string, bool) {
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "test"
	}
	return mode, mode == "test" || mode == "live"
}

func (s *Server) listKeys(w http.ResponseWriter, r *http.Request, m member) {
	mode, ok := modeParam(r)
	if !ok {
		fail(w, 400, "invalid_mode")
		return
	}
	if mode == "live" && m.Org.LiveStatus != "approved" {
		writeJSON(w, 200, map[string]any{"keys": []core.Key{}})
		return
	}
	keys, err := s.Core.ListKeys(r.Context(), m.actor(), m.Org.PartnerID, mode)
	if errors.Is(err, core.ErrNotFound) {
		keys, err = []core.Key{}, nil
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	writeJSON(w, 200, map[string]any{"keys": keys})
}

func (s *Server) createKey(w http.ResponseWriter, r *http.Request, m member) {
	var body struct {
		Name        string   `json:"name"`
		Mode        string   `json:"mode"`
		ExpiresDays int      `json:"expires_days"`
		CIDRs       []string `json:"allowed_cidrs"`
	}
	if !decode(w, r, &body) {
		return
	}
	if !m.canManageKeys() {
		fail(w, 403, "forbidden")
		return
	}
	if body.Mode != "test" && body.Mode != "live" {
		fail(w, 400, "invalid_mode")
		return
	}
	if body.Mode == "live" && (m.Org.LiveStatus != "approved" || (m.Role != "owner" && m.Role != "admin")) {
		// Live keys need a reviewed business and an owner or admin (PRD K5, L4).
		fail(w, 403, "live_not_allowed")
		return
	}
	if !slices.Contains([]int{30, 90, 180, 365}, body.ExpiresDays) {
		fail(w, 400, "invalid_expiry")
		return
	}
	expires := s.now().Add(time.Duration(body.ExpiresDays) * 24 * time.Hour)
	raw, info, err := s.Core.IssueKey(r.Context(), m.actor(), m.Org.PartnerID, body.Mode, body.Name, expires, body.CIDRs)
	if errors.Is(err, core.ErrInvalid) {
		fail(w, 400, "invalid_request")
		return
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	_ = s.Store.Record(r.Context(), m.Org.ID, m.User.ID, "key_created", body.Mode+" "+info.Prefix+"…"+info.Last4)
	writeJSON(w, 201, map[string]any{"key": raw, "info": info})
}

func (s *Server) revokeKey(w http.ResponseWriter, r *http.Request, m member) {
	mode, ok := modeParam(r)
	id := r.PathValue("id")
	if !ok || len(id) != 64 {
		fail(w, 400, "invalid_request")
		return
	}
	if !m.canManageKeys() || (mode == "live" && m.Role != "owner" && m.Role != "admin") {
		fail(w, 403, "forbidden")
		return
	}
	err := s.Core.RevokeKey(r.Context(), m.actor(), m.Org.PartnerID, mode, id)
	if errors.Is(err, core.ErrNotFound) {
		fail(w, 404, "not_found")
		return
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	_ = s.Store.Record(r.Context(), m.Org.ID, m.User.ID, "key_revoked", mode+" "+id[:8])
	w.WriteHeader(204)
}

// ---- usage and activity ----

func (s *Server) usage(w http.ResponseWriter, r *http.Request, m member) {
	mode, ok := modeParam(r)
	days, err := strconv.Atoi(r.URL.Query().Get("days"))
	if r.URL.Query().Get("days") == "" {
		days, err = 30, nil
	}
	if !ok || err != nil || days < 1 || days > 366 {
		fail(w, 400, "invalid_request")
		return
	}
	to := s.now()
	usage, err := s.Core.Usage(r.Context(), m.actor(), m.Org.PartnerID, mode, to.AddDate(0, 0, -(days-1)), to)
	if errors.Is(err, core.ErrNotFound) {
		usage, err = []core.DayUsage{}, nil
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	writeJSON(w, 200, map[string]any{"mode": mode, "days": usage})
}

func (s *Server) activity(w http.ResponseWriter, r *http.Request, m member) {
	items, err := s.Store.RecentActivity(r.Context(), m.Org.ID, 50)
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	writeJSON(w, 200, map[string]any{"activity": items})
}

func newPartnerID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return "org_" + hex.EncodeToString(b)
}

// ---- rate limiting (in memory; one portal instance) ----

type limiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	hits   map[string][]time.Time
}

func newLimiter(limit int, window time.Duration) *limiter {
	return &limiter{limit: limit, window: window, hits: map[string][]time.Time{}}
}

func (l *limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	recent := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if now.Sub(t) < l.window {
			recent = append(recent, t)
		}
	}
	if len(recent) >= l.limit {
		l.hits[key] = recent
		return false
	}
	l.hits[key] = append(recent, now)
	if len(l.hits) > 10000 { // bound memory under abuse
		for k, v := range l.hits {
			if len(v) == 0 || now.Sub(v[len(v)-1]) > l.window {
				delete(l.hits, k)
			}
		}
	}
	return true
}
