package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/auth"
	"github.com/Jmsandi/assay-web/server/internal/billing"
	"github.com/Jmsandi/assay-web/server/internal/core"
	"github.com/Jmsandi/assay-web/server/internal/store"
	"github.com/google/uuid"
)

// ---- fakes ----

type memStore struct {
	mu       sync.Mutex
	users    map[uuid.UUID]store.User
	orgs     map[uuid.UUID]store.Organisation
	members  map[uuid.UUID][]store.Membership
	sessions map[string]struct {
		user    uuid.UUID
		expires time.Time
	}
	activity []string
}

func newMemStore() *memStore {
	return &memStore{users: map[uuid.UUID]store.User{}, orgs: map[uuid.UUID]store.Organisation{}, members: map[uuid.UUID][]store.Membership{}, sessions: map[string]struct {
		user    uuid.UUID
		expires time.Time
	}{}}
}

func (m *memStore) CreateAccount(_ context.Context, u store.User, o store.Organisation) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, x := range m.users {
		if strings.EqualFold(x.Email, u.Email) {
			return store.ErrDuplicate
		}
	}
	o.LiveStatus = "not_started"
	m.users[u.ID], m.orgs[o.ID] = u, o
	m.members[u.ID] = []store.Membership{{Organisation: o, Role: "owner"}}
	return nil
}
func (m *memStore) UserByEmail(_ context.Context, email string) (store.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, u := range m.users {
		if strings.EqualFold(u.Email, email) {
			return u, nil
		}
	}
	return store.User{}, store.ErrNotFound
}
func (m *memStore) UserByID(_ context.Context, id uuid.UUID) (store.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.users[id]
	if !ok {
		return u, store.ErrNotFound
	}
	return u, nil
}
func (m *memStore) Memberships(_ context.Context, id uuid.UUID) ([]store.Membership, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.members[id], nil
}
func (m *memStore) CreateSession(_ context.Context, h string, u uuid.UUID, exp time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[h] = struct {
		user    uuid.UUID
		expires time.Time
	}{u, exp}
	return nil
}
func (m *memStore) SessionUser(_ context.Context, h string, now time.Time) (uuid.UUID, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.sessions[h]
	if !ok || !now.Before(s.expires) {
		return uuid.Nil, store.ErrNotFound
	}
	return s.user, nil
}
func (m *memStore) DeleteSession(_ context.Context, h string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, h)
	return nil
}
func (m *memStore) Record(_ context.Context, _, _ uuid.UUID, action, _ string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.activity = append(m.activity, action)
	return nil
}
func (m *memStore) RecentActivity(context.Context, uuid.UUID, int) ([]store.Activity, error) {
	return []store.Activity{}, nil
}

// setRole changes the signed-in user's role or the organisation's live status.
func (m *memStore) set(email, role, live string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, u := range m.users {
		if u.Email == email {
			ms := m.members[id]
			if role != "" {
				ms[0].Role = role
			}
			if live != "" {
				ms[0].Organisation.LiveStatus = live
			}
		}
	}
}

type fakeCore struct {
	mu       sync.Mutex
	partners map[string]bool
	keys     map[string][]core.Key
	down     bool
	actors   []string
}

func (f *fakeCore) UpsertPartner(_ context.Context, actor, id, mode string, _ int) (core.Partner, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.down {
		return core.Partner{}, core.ErrUnavailable
	}
	f.actors = append(f.actors, actor)
	f.partners[id+":"+mode] = true
	return core.Partner{PartnerID: id, Mode: mode}, nil
}
func (f *fakeCore) Partner(context.Context, string, string, string) (core.Partner, error) {
	return core.Partner{}, nil
}
func (f *fakeCore) SetSuspended(context.Context, string, string, string, bool) error { return nil }
func (f *fakeCore) IssueKey(_ context.Context, _, id, mode, name string, exp time.Time, _ []string) (string, core.Key, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if name == "" {
		return "", core.Key{}, core.ErrInvalid
	}
	k := core.Key{ID: strings.Repeat("a", 63) + string(rune('0'+len(f.keys[id+mode]))), Name: name, Mode: mode, Prefix: "sk_" + mode + "_", Last4: "beef", ExpiresAt: exp}
	f.keys[id+mode] = append(f.keys[id+mode], k)
	return "sk_" + mode + "_" + strings.Repeat("0", 60) + "beef", k, nil
}
func (f *fakeCore) ListKeys(_ context.Context, _, id, mode string) ([]core.Key, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]core.Key{}, f.keys[id+mode]...), nil
}
func (f *fakeCore) RevokeKey(_ context.Context, _, id, mode, key string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i, k := range f.keys[id+mode] {
		if k.ID == key {
			f.keys[id+mode] = append(f.keys[id+mode][:i], f.keys[id+mode][i+1:]...)
			return nil
		}
	}
	return core.ErrNotFound
}
func (f *fakeCore) SetWebhook(context.Context, string, string, string, string, string) error {
	return nil
}
func (f *fakeCore) Usage(context.Context, string, string, string, time.Time, time.Time) ([]core.DayUsage, error) {
	return []core.DayUsage{{Day: "2026-11-14", Created: 3, Decided: 2, Review: 2}}, nil
}
func (f *fakeCore) BillableEvents(context.Context, string, int) ([]core.BillableEvent, string, error) {
	return nil, "", nil
}

// ---- harness ----

const origin = "https://portal.example.test"

type client struct {
	t      *testing.T
	mux    *http.ServeMux
	cookie *http.Cookie
}

func newServer(t *testing.T) (*client, *memStore, *fakeCore) {
	st, fc := newMemStore(), &fakeCore{partners: map[string]bool{}, keys: map[string][]core.Key{}}
	mux := http.NewServeMux()
	(&Server{Store: st, Core: fc, Origin: origin, SecureCookies: true}).Routes(mux)
	return &client{t: t, mux: mux}, st, fc
}

func (c *client) call(method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Origin", origin)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.cookie != nil {
		req.AddCookie(c.cookie)
	}
	w := httptest.NewRecorder()
	c.mux.ServeHTTP(w, req)
	for _, ck := range w.Result().Cookies() {
		if ck.Name == sessionCookie {
			if ck.MaxAge < 0 {
				c.cookie = nil
			} else {
				c.cookie = ck
			}
		}
	}
	return w
}

func expect(t *testing.T, w *httptest.ResponseRecorder, status int, contains string) {
	t.Helper()
	if w.Code != status || !strings.Contains(w.Body.String(), contains) {
		t.Fatalf("got %d %s, want %d containing %q", w.Code, w.Body.String(), status, contains)
	}
}

const signup = `{"name":"Aminata Kamara","company":"Kora Microfinance","email":"aminata@kora.example","password":"correct horse battery"}`

// ---- tests ----

func TestSignupCreatesAccountAndTestPartner(t *testing.T) {
	c, st, fc := newServer(t)
	w := c.call("POST", "/api/auth/signup", signup)
	expect(t, w, 201, "Aminata")
	ck := c.cookie
	if ck == nil || !ck.HttpOnly || !ck.Secure || ck.SameSite != http.SameSiteLaxMode {
		t.Fatalf("session cookie flags: %+v", ck)
	}
	if len(fc.partners) != 1 {
		t.Fatalf("core partner not created: %v", fc.partners)
	}
	for k := range fc.partners {
		if !strings.HasPrefix(k, "org_") || !strings.HasSuffix(k, ":test") {
			t.Fatalf("partner %q", k)
		}
	}
	// Only the hash of the cookie is stored.
	if _, ok := st.sessions[ck.Value]; ok {
		t.Fatal("raw session token stored")
	}
	if _, ok := st.sessions[auth.HashToken(ck.Value)]; !ok {
		t.Fatal("session hash not stored")
	}
	expect(t, c.call("GET", "/api/me", ""), 200, `"role":"owner"`)
	expect(t, c.call("POST", "/api/auth/signup", signup), 409, "email_taken")
}

func TestSignupValidation(t *testing.T) {
	c, _, fc := newServer(t)
	expect(t, c.call("POST", "/api/auth/signup", `{"name":"A","company":"B","email":"a@b.example","password":"short"}`), 400, "weak_password")
	expect(t, c.call("POST", "/api/auth/signup", `{"name":"A","company":"B","email":"not-an-email","password":"long enough password"}`), 400, "invalid_email")
	expect(t, c.call("POST", "/api/auth/signup", `{"name":"A","company":"B","email":"a@b.example","password":"long enough password","admin":true}`), 400, "invalid_request")
	fc.down = true
	expect(t, c.call("POST", "/api/auth/signup", signup), 503, "unavailable")
	fc.down = false
	expect(t, c.call("POST", "/api/auth/signup", signup), 201, "")
}

func TestLoginLogout(t *testing.T) {
	c, _, _ := newServer(t)
	c.call("POST", "/api/auth/signup", signup)
	c.call("POST", "/api/auth/logout", "")
	expect(t, c.call("GET", "/api/me", ""), 401, "signed_out")
	// Unknown account and wrong password give the same answer.
	expect(t, c.call("POST", "/api/auth/login", `{"email":"nobody@kora.example","password":"whatever whatever"}`), 401, "wrong_credentials")
	expect(t, c.call("POST", "/api/auth/login", `{"email":"aminata@kora.example","password":"wrong wrong wrong"}`), 401, "wrong_credentials")
	expect(t, c.call("POST", "/api/auth/login", `{"email":"AMINATA@kora.example","password":"correct horse battery"}`), 200, "Aminata")
	expect(t, c.call("GET", "/api/me", ""), 200, "Kora")
}

func TestCrossSiteRequestsAreRefused(t *testing.T) {
	c, _, _ := newServer(t)
	req := httptest.NewRequest("POST", "/api/auth/signup", strings.NewReader(signup))
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	c.mux.ServeHTTP(w, req)
	expect(t, w, 403, "cross_site_request")
	req = httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(`{}`))
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	c.mux.ServeHTTP(w, req)
	expect(t, w, 403, "cross_site_request")
}

func TestKeysThroughCore(t *testing.T) {
	c, st, _ := newServer(t)
	c.call("POST", "/api/auth/signup", signup)
	w := c.call("POST", "/api/keys", `{"name":"Staging","mode":"test","expires_days":90,"allowed_cidrs":[]}`)
	expect(t, w, 201, `"key":"sk_test_`)
	if w.Header().Get("Cache-Control") != "no-store" {
		t.Fatal("new key response may be cached")
	}
	expect(t, c.call("GET", "/api/keys?mode=test", ""), 200, `"name":"Staging"`)
	if strings.Contains(c.call("GET", "/api/keys?mode=test", "").Body.String(), "sk_test_0000") {
		t.Fatal("listing must never include a key")
	}
	expect(t, c.call("POST", "/api/keys", `{"name":"Prod","mode":"live","expires_days":90}`), 403, "live_not_allowed")
	expect(t, c.call("POST", "/api/keys", `{"name":"Staging","mode":"test","expires_days":7}`), 400, "invalid_expiry")
	expect(t, c.call("DELETE", "/api/keys/"+strings.Repeat("a", 63)+"0?mode=test", ""), 204, "")
	expect(t, c.call("DELETE", "/api/keys/"+strings.Repeat("b", 64)+"?mode=test", ""), 404, "not_found")

	st.set("aminata@kora.example", "", "approved")
	expect(t, c.call("POST", "/api/keys", `{"name":"Prod","mode":"live","expires_days":365}`), 201, `"key":"sk_live_`)
	st.set("aminata@kora.example", "developer", "")
	expect(t, c.call("POST", "/api/keys", `{"name":"Prod 2","mode":"live","expires_days":90}`), 403, "live_not_allowed")
	st.set("aminata@kora.example", "viewer", "")
	expect(t, c.call("POST", "/api/keys", `{"name":"x","mode":"test","expires_days":30}`), 403, "forbidden")
	expect(t, c.call("GET", "/api/usage?mode=test&days=7", ""), 200, `"sessions_created":3`)
}

func TestSignInIsRateLimited(t *testing.T) {
	c, _, _ := newServer(t)
	var last *httptest.ResponseRecorder
	for range 11 {
		last = c.call("POST", "/api/auth/login", `{"email":"x@y.example","password":"whatever whatever"}`)
	}
	expect(t, last, 429, "rate_limited")
}

func TestPasswords(t *testing.T) {
	h, err := auth.HashPassword("correct horse battery")
	if err != nil || !auth.CheckPassword(h, "correct horse battery") || auth.CheckPassword(h, "correct horse batterY") {
		t.Fatal("password check")
	}
	if auth.CheckPassword("argon2id$1$1$1$!!$!!", "x") || auth.CheckPassword("plain", "plain") {
		t.Fatal("malformed hash matched")
	}
	h2, _ := auth.HashPassword("correct horse battery")
	if h == h2 {
		t.Fatal("hashes must be salted")
	}
}

// ---- billing ----

type memBilling struct {
	mu       sync.Mutex
	balance  map[uuid.UUID]int64
	payments map[string]billing.Payment // by provider ref
}

func (b *memBilling) Balance(_ context.Context, id uuid.UUID) (int64, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.balance[id], nil
}
func (b *memBilling) Entries(context.Context, uuid.UUID, int) ([]billing.Entry, error) {
	return []billing.Entry{}, nil
}
func (b *memBilling) Payments(context.Context, uuid.UUID, int) ([]billing.Payment, error) {
	return []billing.Payment{}, nil
}
func (b *memBilling) CreatePayment(_ context.Context, p billing.Payment, _ uuid.UUID) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.payments["pending:"+p.ID.String()] = p
	return nil
}
func (b *memBilling) SetProviderRef(_ context.Context, id uuid.UUID, ref string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	p := b.payments["pending:"+id.String()]
	p.ProviderRef, p.Status = ref, "pending"
	b.payments[ref] = p
	return nil
}
func (b *memBilling) CompletePayment(_ context.Context, _, ref string, cents int64) (uuid.UUID, bool, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	p, ok := b.payments[ref]
	if !ok {
		return uuid.Nil, false, billing.ErrNotFound
	}
	if p.Status == "completed" {
		return p.OrgID, false, nil
	}
	p.Status = "completed"
	b.payments[ref] = p
	b.balance[p.OrgID] += cents
	return p.OrgID, true, nil
}
func (b *memBilling) FailPayment(context.Context, string, string, string) error { return nil }

// fakeProvider accepts a webhook naming a reference and amount (signature checking
// is the real provider's job).
type fakeProvider struct{}

func (fakeProvider) Name() string { return "fake" }
func (fakeProvider) StartTopUp(_ context.Context, p billing.Payment, _ string) (string, string, error) {
	return "ref_" + p.ID.String()[:8], "https://pay.example.test/checkout", nil
}
func (fakeProvider) Confirm(_ context.Context, r *http.Request) (billing.Confirmation, error) {
	if r.Header.Get("X-Test-Signature") != "valid" {
		return billing.Confirmation{}, billing.ErrNotFound
	}
	amount, _ := strconv.ParseInt(r.URL.Query().Get("amount"), 10, 64)
	return billing.Confirmation{ProviderRef: r.URL.Query().Get("ref"), Status: "completed", AmountCents: amount}, nil
}

func TestBillingSummaryAndTopUps(t *testing.T) {
	c, st, _ := newServer(t)
	mb := &memBilling{balance: map[uuid.UUID]int64{}, payments: map[string]billing.Payment{}}
	reconciled := 0
	mux := http.NewServeMux()
	(&Server{Store: st, Core: &fakeCore{partners: map[string]bool{}, keys: map[string][]core.Key{}}, Origin: origin, SecureCookies: true,
		Billing: mb, Provider: billing.None{}, PriceCents: 2_500,
		Reconcile: func(context.Context, uuid.UUID) error { reconciled++; return nil }}).Routes(mux)
	c.mux = mux
	c.call("POST", "/api/auth/signup", signup)
	expect(t, c.call("GET", "/api/billing", ""), 200, `"payments_enabled":false`)
	expect(t, c.call("POST", "/api/billing/topups", `{"amount_cents":500000,"method":"orange_money"}`), 503, "payments_not_configured")

	// With a provider: start a top-up, then the provider confirms it (twice).
	mux = http.NewServeMux()
	(&Server{Store: st, Core: &fakeCore{partners: map[string]bool{}, keys: map[string][]core.Key{}}, Origin: origin, SecureCookies: true,
		Billing: mb, Provider: fakeProvider{}, PriceCents: 2_500,
		Reconcile: func(context.Context, uuid.UUID) error { reconciled++; return nil }}).Routes(mux)
	c.mux = mux
	expect(t, c.call("POST", "/api/billing/topups", `{"amount_cents":5,"method":"orange_money"}`), 400, "invalid_request")
	w := c.call("POST", "/api/billing/topups", `{"amount_cents":500000,"method":"orange_money"}`)
	expect(t, w, 201, "https://pay.example.test/checkout")
	var ref string
	for k, p := range mb.payments {
		if !strings.HasPrefix(k, "pending:") {
			ref = p.ProviderRef
		}
	}
	webhook := func(sig string, amount int) int {
		req := httptest.NewRequest("POST", "/api/payments/webhook?ref="+ref+"&amount="+strconv.Itoa(amount), nil)
		req.Header.Set("X-Test-Signature", sig)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)
		return rec.Code
	}
	if code := webhook("forged", 500000); code != 400 {
		t.Fatalf("unverified webhook: %d", code)
	}
	if code := webhook("valid", 500000); code != 200 {
		t.Fatalf("webhook: %d", code)
	}
	if code := webhook("valid", 500000); code != 200 {
		t.Fatalf("repeat webhook: %d", code)
	}
	expect(t, c.call("GET", "/api/billing", ""), 200, `"balance_cents":500000`)
	if reconciled != 1 {
		t.Fatalf("suspension re-checked %d times, want once (credited once)", reconciled)
	}
	expect(t, c.call("GET", "/api/billing", ""), 200, `"verifications_remaining":200`)
	st.set("aminata@kora.example", "developer", "")
	expect(t, c.call("POST", "/api/billing/topups", `{"amount_cents":500000,"method":"afrimoney"}`), 403, "forbidden")
}
