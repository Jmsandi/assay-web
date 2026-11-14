// Package store is the portal's own database: users, organisations, memberships,
// sessions and activity. It never holds verification data.
package store

import (
	"context"
	"embed"
	"errors"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound  = errors.New("not found")
	ErrDuplicate = errors.New("already exists")
)

type User struct {
	ID           uuid.UUID
	Email        string
	Name         string
	PasswordHash string
	CreatedAt    time.Time
}

type Organisation struct {
	ID            uuid.UUID
	Name          string
	PartnerID     string
	LiveStatus    string
	LiveSuspended bool
	CreatedAt     time.Time
}

type Membership struct {
	Organisation Organisation
	Role         string
}

type Activity struct {
	At     time.Time `json:"at"`
	User   string    `json:"user"`
	Action string    `json:"action"`
	Detail string    `json:"detail"`
}

// Store is what the API needs; tests use an in-memory fake.
type Store interface {
	CreateAccount(ctx context.Context, u User, org Organisation) error
	UserByEmail(ctx context.Context, email string) (User, error)
	UserByID(ctx context.Context, id uuid.UUID) (User, error)
	Memberships(ctx context.Context, userID uuid.UUID) ([]Membership, error)
	CreateSession(ctx context.Context, tokenHash string, userID uuid.UUID, expires time.Time) error
	SessionUser(ctx context.Context, tokenHash string, now time.Time) (uuid.UUID, error)
	DeleteSession(ctx context.Context, tokenHash string) error
	Record(ctx context.Context, orgID, userID uuid.UUID, action, detail string) error
	RecentActivity(ctx context.Context, orgID uuid.UUID, limit int) ([]Activity, error)
}

type Postgres struct{ Pool *pgxpool.Pool }

func (p Postgres) CreateAccount(ctx context.Context, u User, org Organisation) error {
	tx, err := p.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err = tx.Exec(ctx, `INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)`, u.ID, u.Email, u.Name, u.PasswordHash); err != nil {
		if isUnique(err) {
			return ErrDuplicate
		}
		return err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO organisations(id,name,partner_id) VALUES($1,$2,$3)`, org.ID, org.Name, org.PartnerID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO memberships(organisation_id,user_id,role) VALUES($1,$2,'owner')`, org.ID, u.ID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO activity(organisation_id,user_id,action) VALUES($1,$2,'account_created')`, org.ID, u.ID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (p Postgres) UserByEmail(ctx context.Context, email string) (User, error) {
	return p.user(ctx, `SELECT id,email,name,password_hash,created_at FROM users WHERE lower(email)=lower($1)`, email)
}

func (p Postgres) UserByID(ctx context.Context, id uuid.UUID) (User, error) {
	return p.user(ctx, `SELECT id,email,name,password_hash,created_at FROM users WHERE id=$1`, id)
}

func (p Postgres) user(ctx context.Context, q string, arg any) (User, error) {
	var u User
	err := p.Pool.QueryRow(ctx, q, arg).Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, ErrNotFound
	}
	return u, err
}

func (p Postgres) Memberships(ctx context.Context, userID uuid.UUID) ([]Membership, error) {
	rows, err := p.Pool.Query(ctx, `SELECT o.id,o.name,o.partner_id,o.live_status,o.live_suspended,o.created_at,m.role FROM memberships m JOIN organisations o ON o.id=m.organisation_id WHERE m.user_id=$1 ORDER BY o.created_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Membership
	for rows.Next() {
		var m Membership
		if err = rows.Scan(&m.Organisation.ID, &m.Organisation.Name, &m.Organisation.PartnerID, &m.Organisation.LiveStatus, &m.Organisation.LiveSuspended, &m.Organisation.CreatedAt, &m.Role); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (p Postgres) CreateSession(ctx context.Context, tokenHash string, userID uuid.UUID, expires time.Time) error {
	_, err := p.Pool.Exec(ctx, `INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)`, tokenHash, userID, expires)
	return err
}

func (p Postgres) SessionUser(ctx context.Context, tokenHash string, now time.Time) (uuid.UUID, error) {
	var id uuid.UUID
	err := p.Pool.QueryRow(ctx, `SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at>$2`, tokenHash, now).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return id, ErrNotFound
	}
	return id, err
}

func (p Postgres) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := p.Pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1`, tokenHash)
	return err
}

func (p Postgres) Record(ctx context.Context, orgID, userID uuid.UUID, action, detail string) error {
	_, err := p.Pool.Exec(ctx, `INSERT INTO activity(organisation_id,user_id,action,detail) VALUES($1,$2,$3,$4)`, orgID, userID, action, detail)
	return err
}

func (p Postgres) RecentActivity(ctx context.Context, orgID uuid.UUID, limit int) ([]Activity, error) {
	rows, err := p.Pool.Query(ctx, `SELECT a.at,COALESCE(u.name,''),a.action,a.detail FROM activity a LEFT JOIN users u ON u.id=a.user_id WHERE a.organisation_id=$1 ORDER BY a.at DESC LIMIT $2`, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Activity{}
	for rows.Next() {
		var a Activity
		if err = rows.Scan(&a.At, &a.User, &a.Action, &a.Detail); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func isUnique(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23505"
}

//go:embed migrations/*.sql
var migrations embed.FS

// Migrate applies new migrations in order, each in its own transaction, and refuses
// to run if an applied migration's file changed.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, body text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	entries, err := migrations.ReadDir("migrations")
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		body, err := migrations.ReadFile("migrations/" + e.Name())
		if err != nil {
			return err
		}
		var applied string
		err = pool.QueryRow(ctx, `SELECT body FROM schema_migrations WHERE name=$1`, e.Name()).Scan(&applied)
		if err == nil {
			if applied != string(body) {
				return errors.New("migration " + e.Name() + " changed after it was applied")
			}
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, string(body)); err == nil {
			_, err = tx.Exec(ctx, `INSERT INTO schema_migrations(name,body) VALUES($1,$2)`, e.Name(), string(body))
		}
		if err != nil {
			_ = tx.Rollback(ctx)
			return errors.New("migration " + e.Name() + " failed: " + err.Error())
		}
		if err = tx.Commit(ctx); err != nil {
			return err
		}
	}
	return nil
}
