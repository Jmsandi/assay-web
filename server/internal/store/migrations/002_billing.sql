-- Prepaid billing (PRD 5.6, 6, 7). Money is in cents of a Leone (SLE).

-- Whether Core currently has this organisation's live partner suspended (no balance).
ALTER TABLE organisations ADD COLUMN live_suspended boolean NOT NULL DEFAULT false;

-- Top-ups through a payment provider (Monime). The wallet is credited only from the
-- provider's confirmation, once per payment.
CREATE TABLE payments (
  id uuid PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES organisations,
  provider text NOT NULL,
  provider_ref text,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  method text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('pending','completed','failed','expired')),
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (provider, provider_ref)
);
CREATE INDEX payments_org ON payments (organisation_id, created_at DESC);

-- The ledger: every change to a balance is one row; the balance is their sum.
-- A charge is tied to one billable event, a top-up to one payment, so neither can
-- happen twice.
CREATE TABLE ledger_entries (
  id bigserial PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES organisations,
  kind text NOT NULL CHECK (kind IN ('top_up','charge','credit','refund')),
  amount_cents bigint NOT NULL,
  description text NOT NULL DEFAULT '',
  billable_event_id text UNIQUE,
  session_id text,
  payment_id uuid UNIQUE REFERENCES payments,
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'charge') = (billable_event_id IS NOT NULL)),
  CHECK ((kind = 'top_up') = (payment_id IS NOT NULL)),
  CHECK (kind = 'charge' OR amount_cents <> 0)
);
CREATE INDEX ledger_org ON ledger_entries (organisation_id, created_at DESC);

-- Append-only: corrections are new entries (a refund or a credit), never edits.
CREATE FUNCTION ledger_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger entries are append-only';
END
$$;
CREATE TRIGGER ledger_no_change BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION ledger_append_only();

-- Where the billing worker is in Core's billable-events feed.
CREATE TABLE billing_state (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
