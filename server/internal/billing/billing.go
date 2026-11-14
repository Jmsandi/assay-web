// Package billing is the prepaid wallet: an append-only ledger, the worker that charges
// each billable verification from Core exactly once, and payment top-ups.
package billing

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/core"
	"github.com/google/uuid"
)

var ErrNotFound = errors.New("not found")

// Charge is one billable verification turned into a ledger entry.
type Charge struct {
	OrgID     uuid.UUID
	EventID   string
	SessionID string
	Outcome   string
	Amount    int64 // cents, positive; stored as a negative entry
	At        time.Time
}

type Entry struct {
	ID          int64     `json:"id"`
	Kind        string    `json:"kind"`
	AmountCents int64     `json:"amount_cents"`
	Description string    `json:"description"`
	Reference   string    `json:"reference"`
	At          time.Time `json:"at"`
}

type Org struct {
	ID            uuid.UUID
	PartnerID     string
	LiveSuspended bool
}

// Ledger is the billing side of the portal database; tests use a fake.
type Ledger interface {
	OrgByPartner(ctx context.Context, partnerID string) (Org, error)
	OrgByID(ctx context.Context, id uuid.UUID) (Org, error)
	Cursor(ctx context.Context) (string, error)
	// ApplyCharges records the charges (each event at most once) and moves the cursor
	// to next, in one transaction. It returns how many were new.
	ApplyCharges(ctx context.Context, charges []Charge, next string) (int, error)
	Balance(ctx context.Context, orgID uuid.UUID) (int64, error)
	Credit(ctx context.Context, orgID uuid.UUID, kind string, amount int64, description string, by *uuid.UUID) error
	Entries(ctx context.Context, orgID uuid.UUID, limit int) ([]Entry, error)
	SetLiveSuspended(ctx context.Context, orgID uuid.UUID, suspended bool) error
}

// Worker charges billable events and keeps Core's suspension in step with balances.
type Worker struct {
	Ledger Ledger
	Core   core.API
	// PriceCents is charged per billable live verification (pricing is a business
	// decision; 0 records events without moving balances).
	PriceCents int64
	PageSize   int
}

// RunOnce reads the feed until it is empty. It is safe to run again after any failure:
// charges are unique per event and the cursor only moves with them.
func (w Worker) RunOnce(ctx context.Context) error {
	size := w.PageSize
	if size == 0 {
		size = 500
	}
	for {
		cursor, err := w.Ledger.Cursor(ctx)
		if err != nil {
			return err
		}
		events, next, err := w.Core.BillableEvents(ctx, cursor, size)
		if err != nil {
			return err
		}
		if len(events) == 0 {
			return nil
		}
		var charges []Charge
		touched := map[uuid.UUID]bool{}
		for _, e := range events {
			if e.Mode != "live" {
				continue // test mode is free
			}
			org, err := w.Ledger.OrgByPartner(ctx, e.PartnerID)
			if errors.Is(err, ErrNotFound) {
				continue // a partner managed outside the portal (e.g. the pilot partner)
			}
			if err != nil {
				return err
			}
			charges = append(charges, Charge{OrgID: org.ID, EventID: e.ID, SessionID: e.SessionID, Outcome: e.Outcome, Amount: w.PriceCents, At: e.DecidedAt})
			touched[org.ID] = true
		}
		if _, err = w.Ledger.ApplyCharges(ctx, charges, next); err != nil {
			return err
		}
		for id := range touched {
			if err = w.Reconcile(ctx, id); err != nil {
				log.Printf("billing: suspension check failed for %s: %v", id, err)
			}
		}
		if len(events) < size {
			return nil
		}
	}
}

// Reconcile suspends an organisation's live partner at a zero balance and lifts the
// suspension once it is positive again.
func (w Worker) Reconcile(ctx context.Context, orgID uuid.UUID) error {
	org, err := w.Ledger.OrgByID(ctx, orgID)
	if err != nil {
		return err
	}
	balance, err := w.Ledger.Balance(ctx, orgID)
	if err != nil {
		return err
	}
	want := balance <= 0 && w.PriceCents > 0
	if want == org.LiveSuspended {
		return nil
	}
	err = w.Core.SetSuspended(ctx, "billing", org.PartnerID, "live", want)
	if errors.Is(err, core.ErrNotFound) {
		return w.Ledger.SetLiveSuspended(ctx, orgID, want) // no live partner yet
	}
	if err != nil {
		return err
	}
	return w.Ledger.SetLiveSuspended(ctx, orgID, want)
}

// Loop runs RunOnce every interval until ctx ends.
func (w Worker) Loop(ctx context.Context, interval time.Duration) {
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		if err := w.RunOnce(ctx); err != nil && ctx.Err() == nil {
			log.Printf("billing: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}
