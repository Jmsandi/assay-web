package api

import (
	"context"
	"errors"
	"log"
	"net/http"
	"slices"

	"github.com/Jmsandi/assay-web/server/internal/billing"
	"github.com/google/uuid"
)

// BillingStore is the billing side of the database the API needs.
type BillingStore interface {
	Balance(ctx context.Context, orgID uuid.UUID) (int64, error)
	Entries(ctx context.Context, orgID uuid.UUID, limit int) ([]billing.Entry, error)
	Payments(ctx context.Context, orgID uuid.UUID, limit int) ([]billing.Payment, error)
	CreatePayment(ctx context.Context, p billing.Payment, by uuid.UUID) error
	SetProviderRef(ctx context.Context, id uuid.UUID, ref string) error
	CompletePayment(ctx context.Context, provider, ref string, confirmedCents int64) (uuid.UUID, bool, error)
	FailPayment(ctx context.Context, provider, ref, status string) error
}

// Top-up limits in cents (Le 10 to Le 100,000); providers have their own limits too.
const (
	minTopUpCents = 1_000
	maxTopUpCents = 10_000_000
)

func (s *Server) billingRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/billing", s.member(s.billingSummary))
	mux.HandleFunc("POST /api/billing/topups", s.guard(s.member(s.startTopUp)))
	// Called by the payment provider, server to server: no browser origin, no session.
	mux.HandleFunc("POST /api/payments/webhook", s.paymentWebhook)
}

func (s *Server) billingSummary(w http.ResponseWriter, r *http.Request, m member) {
	if s.Billing == nil {
		fail(w, 503, "unavailable")
		return
	}
	balance, err := s.Billing.Balance(r.Context(), m.Org.ID)
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	entries, err1 := s.Billing.Entries(r.Context(), m.Org.ID, 50)
	payments, err2 := s.Billing.Payments(r.Context(), m.Org.ID, 20)
	if err1 != nil || err2 != nil {
		fail(w, 503, "unavailable")
		return
	}
	_, none := s.Provider.(billing.None)
	writeJSON(w, 200, map[string]any{
		"currency":                "SLE",
		"balance_cents":           balance,
		"price_cents":             s.PriceCents,
		"live_suspended":          m.Org.LiveSuspended,
		"payments_enabled":        s.Provider != nil && !none,
		"entries":                 entries,
		"payments":                payments,
		"min_top_up_cents":        minTopUpCents,
		"max_top_up_cents":        maxTopUpCents,
		"verifications_remaining": remaining(balance, s.PriceCents),
	})
}

func remaining(balance, price int64) *int64 {
	if price <= 0 {
		return nil
	}
	n := max(balance, 0) / price
	return &n
}

func (s *Server) startTopUp(w http.ResponseWriter, r *http.Request, m member) {
	var body struct {
		AmountCents int64  `json:"amount_cents"`
		Method      string `json:"method"`
	}
	if !decode(w, r, &body) {
		return
	}
	if !slices.Contains([]string{"owner", "admin", "billing"}, m.Role) {
		fail(w, 403, "forbidden")
		return
	}
	if body.AmountCents < minTopUpCents || body.AmountCents > maxTopUpCents || !slices.Contains([]string{"orange_money", "afrimoney", "card"}, body.Method) {
		fail(w, 400, "invalid_request")
		return
	}
	if s.Provider == nil || s.Billing == nil {
		fail(w, 503, "payments_not_configured")
		return
	}
	pay := billing.Payment{ID: uuid.New(), OrgID: m.Org.ID, Provider: s.Provider.Name(), AmountCents: body.AmountCents, Method: body.Method}
	ref, redirect, err := s.Provider.StartTopUp(r.Context(), pay, s.Origin+"/app/billing")
	if errors.Is(err, billing.ErrPaymentsNotConfigured) {
		fail(w, 503, "payments_not_configured")
		return
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	if err = s.Billing.CreatePayment(r.Context(), pay, m.User.ID); err == nil {
		err = s.Billing.SetProviderRef(r.Context(), pay.ID, ref)
	}
	if err != nil {
		fail(w, 503, "unavailable")
		return
	}
	_ = s.Store.Record(r.Context(), m.Org.ID, m.User.ID, "top_up_started", body.Method)
	writeJSON(w, 201, map[string]any{"payment_id": pay.ID, "redirect_url": redirect})
}

func (s *Server) paymentWebhook(w http.ResponseWriter, r *http.Request) {
	if s.Provider == nil || s.Billing == nil {
		fail(w, 404, "not_found")
		return
	}
	c, err := s.Provider.Confirm(r.Context(), r)
	if err != nil {
		// Unverifiable or unknown: refuse; the provider retries real ones.
		fail(w, 400, "unverified")
		return
	}
	switch c.Status {
	case "completed":
		org, credited, err := s.Billing.CompletePayment(r.Context(), s.Provider.Name(), c.ProviderRef, c.AmountCents)
		if errors.Is(err, billing.ErrNotFound) {
			fail(w, 404, "not_found")
			return
		}
		if err != nil {
			log.Printf("payments: completing %s: %v", c.ProviderRef, err)
			fail(w, 503, "unavailable")
			return
		}
		if credited && s.Reconcile != nil {
			if err = s.Reconcile(r.Context(), org); err != nil {
				log.Printf("payments: lifting suspension: %v", err)
			}
		}
	case "failed", "expired":
		if err = s.Billing.FailPayment(r.Context(), s.Provider.Name(), c.ProviderRef, c.Status); err != nil {
			fail(w, 503, "unavailable")
			return
		}
	}
	w.WriteHeader(200)
}
