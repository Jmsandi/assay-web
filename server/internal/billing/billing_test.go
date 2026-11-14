package billing

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/core"
	"github.com/google/uuid"
)

// memLedger mirrors the database's rules: one charge per event id, cursor saved with
// the charges.
type memLedger struct {
	mu        sync.Mutex
	orgs      map[string]Org
	entries   map[uuid.UUID][]int64
	charged   map[string]bool
	cursor    string
	failApply bool
}

func newMemLedger(orgs ...Org) *memLedger {
	l := &memLedger{orgs: map[string]Org{}, entries: map[uuid.UUID][]int64{}, charged: map[string]bool{}}
	for _, o := range orgs {
		l.orgs[o.PartnerID] = o
	}
	return l
}

func (l *memLedger) OrgByPartner(_ context.Context, p string) (Org, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	o, ok := l.orgs[p]
	if !ok {
		return o, ErrNotFound
	}
	return o, nil
}
func (l *memLedger) OrgByID(_ context.Context, id uuid.UUID) (Org, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	for _, o := range l.orgs {
		if o.ID == id {
			return o, nil
		}
	}
	return Org{}, ErrNotFound
}
func (l *memLedger) Cursor(context.Context) (string, error) { return l.cursor, nil }
func (l *memLedger) ApplyCharges(_ context.Context, cs []Charge, next string) (int, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.failApply {
		return 0, context.DeadlineExceeded
	}
	n := 0
	for _, c := range cs {
		if l.charged[c.EventID] {
			continue
		}
		l.charged[c.EventID] = true
		l.entries[c.OrgID] = append(l.entries[c.OrgID], -c.Amount)
		n++
	}
	l.cursor = next
	return n, nil
}
func (l *memLedger) Balance(_ context.Context, id uuid.UUID) (int64, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	var b int64
	for _, a := range l.entries[id] {
		b += a
	}
	return b, nil
}
func (l *memLedger) Credit(_ context.Context, id uuid.UUID, _ string, amount int64, _ string, _ *uuid.UUID) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.entries[id] = append(l.entries[id], amount)
	return nil
}
func (l *memLedger) Entries(context.Context, uuid.UUID, int) ([]Entry, error) { return nil, nil }
func (l *memLedger) SetLiveSuspended(_ context.Context, id uuid.UUID, s bool) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	for k, o := range l.orgs {
		if o.ID == id {
			o.LiveSuspended = s
			l.orgs[k] = o
		}
	}
	return nil
}

// feedCore serves a fixed list of events from a cursor (the index as a string).
type feedCore struct {
	core.API
	events    []core.BillableEvent
	suspended map[string]bool
}

func (f *feedCore) BillableEvents(_ context.Context, after string, limit int) ([]core.BillableEvent, string, error) {
	start := 0
	if after != "" {
		for i, e := range f.events {
			if e.ID == after {
				start = i + 1
			}
		}
	}
	end := min(start+limit, len(f.events))
	page := f.events[start:end]
	next := after
	if len(page) > 0 {
		next = page[len(page)-1].ID
	}
	return page, next, nil
}
func (f *feedCore) SetSuspended(_ context.Context, _, partner, mode string, s bool) error {
	f.suspended[partner+":"+mode] = s
	return nil
}

func ev(id, partner, mode string) core.BillableEvent {
	return core.BillableEvent{ID: id, PartnerID: partner, Mode: mode, SessionID: "ses_" + id, Outcome: "review", DecidedAt: time.Now()}
}

func TestEachVerificationIsChargedOnce(t *testing.T) {
	org := Org{ID: uuid.New(), PartnerID: "org_a"}
	l := newMemLedger(org)
	_ = l.Credit(context.Background(), org.ID, "credit", 10_000, "start", nil)
	fc := &feedCore{suspended: map[string]bool{}, events: []core.BillableEvent{
		ev("e1", "org_a", "live"), ev("e2", "org_a", "test"), ev("e3", "staging_demo", "live"), ev("e4", "org_a", "live"),
	}}
	w := Worker{Ledger: l, Core: fc, PriceCents: 2_500, PageSize: 2}
	if err := w.RunOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if b, _ := l.Balance(context.Background(), org.ID); b != 10_000-2*2_500 {
		t.Fatalf("balance %d: only live events of portal partners are charged", b)
	}
	// Running again (or the feed repeating events) charges nothing more.
	l.cursor = ""
	if err := w.RunOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if b, _ := l.Balance(context.Background(), org.ID); b != 5_000 {
		t.Fatalf("charged twice: balance %d", b)
	}
}

func TestAFailedWriteDoesNotMoveTheCursor(t *testing.T) {
	org := Org{ID: uuid.New(), PartnerID: "org_a"}
	l := newMemLedger(org)
	l.failApply = true
	fc := &feedCore{suspended: map[string]bool{}, events: []core.BillableEvent{ev("e1", "org_a", "live")}}
	w := Worker{Ledger: l, Core: fc, PriceCents: 100}
	if err := w.RunOnce(context.Background()); err == nil {
		t.Fatal("expected an error")
	}
	if l.cursor != "" {
		t.Fatal("cursor moved without the charges")
	}
	l.failApply = false
	if err := w.RunOnce(context.Background()); err != nil || len(l.charged) != 1 {
		t.Fatalf("retry: %v %d", err, len(l.charged))
	}
}

func TestSuspendAtZeroAndResumeAfterCredit(t *testing.T) {
	org := Org{ID: uuid.New(), PartnerID: "org_a"}
	l := newMemLedger(org)
	_ = l.Credit(context.Background(), org.ID, "credit", 2_500, "start", nil)
	fc := &feedCore{suspended: map[string]bool{}, events: []core.BillableEvent{ev("e1", "org_a", "live")}}
	w := Worker{Ledger: l, Core: fc, PriceCents: 2_500}
	if err := w.RunOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if !fc.suspended["org_a:live"] {
		t.Fatal("not suspended at a zero balance")
	}
	_ = l.Credit(context.Background(), org.ID, "credit", 5_000, "top up", nil)
	if err := w.Reconcile(context.Background(), org.ID); err != nil {
		t.Fatal(err)
	}
	if fc.suspended["org_a:live"] {
		t.Fatal("still suspended after a credit")
	}
}

func TestNoSuspensionWhilePricingIsUnset(t *testing.T) {
	org := Org{ID: uuid.New(), PartnerID: "org_a"}
	l := newMemLedger(org)
	fc := &feedCore{suspended: map[string]bool{}, events: []core.BillableEvent{ev("e1", "org_a", "live")}}
	if err := (Worker{Ledger: l, Core: fc, PriceCents: 0}).RunOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if fc.suspended["org_a:live"] || len(l.charged) != 1 {
		t.Fatal("price 0 records the event but must not suspend")
	}
}
