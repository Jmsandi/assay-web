-- Portal accounts. No identity data from verifications is ever stored here.
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email ON users (lower(email));

-- One organisation per business. partner_id is its ID in Core (test and live modes).
CREATE TABLE organisations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  partner_id text NOT NULL UNIQUE,
  live_status text NOT NULL DEFAULT 'not_started' CHECK (live_status IN ('not_started','submitted','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  organisation_id uuid NOT NULL REFERENCES organisations ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','developer','billing','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id, user_id)
);

-- Sign-in sessions: only a hash of the cookie value is stored.
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- What happened in an organisation, by whom (PRD A7). Append-only by convention.
CREATE TABLE activity (
  id bigserial PRIMARY KEY,
  organisation_id uuid REFERENCES organisations ON DELETE CASCADE,
  user_id uuid REFERENCES users ON DELETE SET NULL,
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_org ON activity (organisation_id, at DESC);
