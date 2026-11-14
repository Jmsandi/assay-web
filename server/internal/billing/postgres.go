package billing

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const cursorName = "core_billable_events"

type Postgres struct{ Pool *pgxpool.Pool }

func (p Postgres) org(ctx context.Context, q string, arg any) (Org, error) {
	var o Org
	err := p.Pool.QueryRow(ctx, q, arg).Scan(&o.ID, &o.PartnerID, &o.LiveSuspended)
	if errors.Is(err, pgx.ErrNoRows) {
		return o, ErrNotFound
	}
	return o, err
}

func (p Postgres) OrgByPartner(ctx context.Context, partnerID string) (Org, error) {
	return p.org(ctx, `SELECT id,partner_id,live_suspended FROM organisations WHERE partner_id=$1`, partnerID)
}

func (p Postgres) OrgByID(ctx context.Context, id uuid.UUID) (Org, error) {
	return p.org(ctx, `SELECT id,partner_id,live_suspended FROM organisations WHERE id=$1`, id)
}

func (p Postgres) Cursor(ctx context.Context) (string, error) {
	var v string
	err := p.Pool.QueryRow(ctx, `SELECT value FROM billing_state WHERE name=$1`, cursorName).Scan(&v)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return v, err
}

func (p Postgres) ApplyCharges(ctx context.Context, charges []Charge, next string) (int, error) {
	tx, err := p.Pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	applied := 0
	for _, c := range charges {
		tag, err := tx.Exec(ctx, `INSERT INTO ledger_entries(organisation_id,kind,amount_cents,description,billable_event_id,session_id,created_at)
VALUES($1,'charge',$2,$3,$4,$5,$6) ON CONFLICT (billable_event_id) DO NOTHING`, c.OrgID, -c.Amount, "Verification ("+c.Outcome+")", c.EventID, c.SessionID, c.At)
		if err != nil {
			return 0, err
		}
		applied += int(tag.RowsAffected())
	}
	if _, err = tx.Exec(ctx, `INSERT INTO billing_state(name,value) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`, cursorName, next); err != nil {
		return 0, err
	}
	return applied, tx.Commit(ctx)
}

func (p Postgres) Balance(ctx context.Context, orgID uuid.UUID) (int64, error) {
	var b int64
	err := p.Pool.QueryRow(ctx, `SELECT COALESCE(sum(amount_cents),0) FROM ledger_entries WHERE organisation_id=$1`, orgID).Scan(&b)
	return b, err
}

// Credit records an operator credit or refund (top-ups go through CompletePayment).
func (p Postgres) Credit(ctx context.Context, orgID uuid.UUID, kind string, amount int64, description string, by *uuid.UUID) error {
	if (kind != "credit" && kind != "refund") || amount == 0 || description == "" {
		return errors.New("invalid credit")
	}
	_, err := p.Pool.Exec(ctx, `INSERT INTO ledger_entries(organisation_id,kind,amount_cents,description,created_by) VALUES($1,$2,$3,$4,$5)`, orgID, kind, amount, description, by)
	return err
}

func (p Postgres) Entries(ctx context.Context, orgID uuid.UUID, limit int) ([]Entry, error) {
	rows, err := p.Pool.Query(ctx, `SELECT l.id,l.kind,l.amount_cents,l.description,COALESCE(l.session_id,pm.provider_ref,''),l.created_at
FROM ledger_entries l LEFT JOIN payments pm ON pm.id=l.payment_id WHERE l.organisation_id=$1 ORDER BY l.created_at DESC, l.id DESC LIMIT $2`, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Entry{}
	for rows.Next() {
		var e Entry
		if err = rows.Scan(&e.ID, &e.Kind, &e.AmountCents, &e.Description, &e.Reference, &e.At); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (p Postgres) SetLiveSuspended(ctx context.Context, orgID uuid.UUID, suspended bool) error {
	_, err := p.Pool.Exec(ctx, `UPDATE organisations SET live_suspended=$2 WHERE id=$1`, orgID, suspended)
	return err
}

// ---- payments ----

type Payment struct {
	ID          uuid.UUID  `json:"id"`
	OrgID       uuid.UUID  `json:"-"`
	Provider    string     `json:"provider"`
	ProviderRef string     `json:"reference"`
	AmountCents int64      `json:"amount_cents"`
	Method      string     `json:"method"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`
}

func (p Postgres) CreatePayment(ctx context.Context, pay Payment, by uuid.UUID) error {
	_, err := p.Pool.Exec(ctx, `INSERT INTO payments(id,organisation_id,provider,amount_cents,method,status,created_by) VALUES($1,$2,$3,$4,$5,'pending',$6)`, pay.ID, pay.OrgID, pay.Provider, pay.AmountCents, pay.Method, by)
	return err
}

func (p Postgres) SetProviderRef(ctx context.Context, id uuid.UUID, ref string) error {
	_, err := p.Pool.Exec(ctx, `UPDATE payments SET provider_ref=$2 WHERE id=$1 AND provider_ref IS NULL`, id, ref)
	return err
}

// CompletePayment marks a payment completed and credits the wallet, once: a second
// confirmation for the same payment changes nothing. The amount credited is the one
// the provider confirmed, which must equal the amount requested.
func (p Postgres) CompletePayment(ctx context.Context, provider, ref string, confirmedCents int64) (uuid.UUID, bool, error) {
	tx, err := p.Pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, false, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var id, org uuid.UUID
	var amount int64
	var status string
	err = tx.QueryRow(ctx, `SELECT id,organisation_id,amount_cents,status FROM payments WHERE provider=$1 AND provider_ref=$2 FOR UPDATE`, provider, ref).Scan(&id, &org, &amount, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, false, ErrNotFound
	}
	if err != nil {
		return uuid.Nil, false, err
	}
	if status == "completed" {
		return org, false, nil
	}
	if confirmedCents != amount {
		return uuid.Nil, false, errors.New("confirmed amount differs from the payment")
	}
	if _, err = tx.Exec(ctx, `UPDATE payments SET status='completed',completed_at=now() WHERE id=$1`, id); err != nil {
		return uuid.Nil, false, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO ledger_entries(organisation_id,kind,amount_cents,description,payment_id) VALUES($1,'top_up',$2,'Top-up',$3)`, org, amount, id); err != nil {
		return uuid.Nil, false, err
	}
	return org, true, tx.Commit(ctx)
}

func (p Postgres) FailPayment(ctx context.Context, provider, ref, status string) error {
	_, err := p.Pool.Exec(ctx, `UPDATE payments SET status=$3 WHERE provider=$1 AND provider_ref=$2 AND status='pending'`, provider, ref, status)
	return err
}

func (p Postgres) Payments(ctx context.Context, orgID uuid.UUID, limit int) ([]Payment, error) {
	rows, err := p.Pool.Query(ctx, `SELECT id,provider,COALESCE(provider_ref,''),amount_cents,method,status,created_at,completed_at FROM payments WHERE organisation_id=$1 ORDER BY created_at DESC LIMIT $2`, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Payment{}
	for rows.Next() {
		var pay Payment
		if err = rows.Scan(&pay.ID, &pay.Provider, &pay.ProviderRef, &pay.AmountCents, &pay.Method, &pay.Status, &pay.CreatedAt, &pay.CompletedAt); err != nil {
			return nil, err
		}
		out = append(out, pay)
	}
	return out, rows.Err()
}
