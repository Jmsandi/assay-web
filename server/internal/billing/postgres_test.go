package billing

// Real-database tests: run with PORTAL_TEST_DATABASE_URL pointing at a disposable
// database (CI starts one). Skipped otherwise.

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("PORTAL_TEST_DATABASE_URL")
	if url == "" {
		if os.Getenv("PORTAL_REQUIRE_DATABASE") == "1" {
			t.Fatal("PORTAL_TEST_DATABASE_URL is required")
		}
		t.Skip("PORTAL_TEST_DATABASE_URL not set")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	if err = store.Migrate(ctx, pool); err != nil {
		t.Fatal(err)
	}
	if err = store.Migrate(ctx, pool); err != nil {
		t.Fatal("migrations are not re-runnable: ", err)
	}
	return pool
}

func TestLedgerOnRealDatabase(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	st, l := store.Postgres{Pool: pool}, Postgres{Pool: pool}
	user := store.User{ID: uuid.New(), Email: uuid.NewString() + "@example.test", Name: "Test", PasswordHash: "x"}
	org := store.Organisation{ID: uuid.New(), Name: "Test org", PartnerID: "org_" + strings.ReplaceAll(uuid.NewString(), "-", "")[:16]}
	if err := st.CreateAccount(ctx, user, org); err != nil {
		t.Fatal(err)
	}
	if err := st.CreateAccount(ctx, store.User{ID: uuid.New(), Email: strings.ToUpper(user.Email), Name: "Dup", PasswordHash: "x"}, store.Organisation{ID: uuid.New(), Name: "x", PartnerID: "org_dup" + org.PartnerID[4:12]}); err != store.ErrDuplicate {
		t.Fatalf("duplicate email (any case) must be refused: %v", err)
	}

	// Charges: once per event, cursor saved with them.
	charge := Charge{OrgID: org.ID, EventID: "bev_" + uuid.NewString(), SessionID: "ses_1", Outcome: "review", Amount: 2_500, At: time.Now()}
	if n, err := l.ApplyCharges(ctx, []Charge{charge}, "cursor-1"); err != nil || n != 1 {
		t.Fatalf("first apply: %d %v", n, err)
	}
	if n, err := l.ApplyCharges(ctx, []Charge{charge}, "cursor-2"); err != nil || n != 0 {
		t.Fatalf("repeat apply charged again: %d %v", n, err)
	}
	if c, _ := l.Cursor(ctx); c != "cursor-2" {
		t.Fatalf("cursor %q", c)
	}

	// Payments: credited once, only for the confirmed amount.
	pay := Payment{ID: uuid.New(), OrgID: org.ID, Provider: "test", AmountCents: 500_000, Method: "orange_money"}
	if err := l.CreatePayment(ctx, pay, user.ID); err != nil {
		t.Fatal(err)
	}
	ref := "ref_" + uuid.NewString()
	if err := l.SetProviderRef(ctx, pay.ID, ref); err != nil {
		t.Fatal(err)
	}
	if _, _, err := l.CompletePayment(ctx, "test", ref, 1); err == nil {
		t.Fatal("a different confirmed amount must not credit")
	}
	if _, credited, err := l.CompletePayment(ctx, "test", ref, 500_000); err != nil || !credited {
		t.Fatalf("complete: %v %v", credited, err)
	}
	if _, credited, err := l.CompletePayment(ctx, "test", ref, 500_000); err != nil || credited {
		t.Fatalf("second confirmation credited again: %v %v", credited, err)
	}
	if b, _ := l.Balance(ctx, org.ID); b != 500_000-2_500 {
		t.Fatalf("balance %d", b)
	}

	// The ledger is append-only.
	if _, err := pool.Exec(ctx, `UPDATE ledger_entries SET amount_cents=1 WHERE organisation_id=$1`, org.ID); err == nil || !strings.Contains(err.Error(), "append-only") {
		t.Fatalf("update allowed: %v", err)
	}
	if _, err := pool.Exec(ctx, `DELETE FROM ledger_entries WHERE organisation_id=$1`, org.ID); err == nil {
		t.Fatal("delete allowed")
	}
	if err := l.Credit(ctx, org.ID, "credit", 1_000, "Operator: goodwill", nil); err != nil {
		t.Fatal(err)
	}
	entries, err := l.Entries(ctx, org.ID, 10)
	if err != nil || len(entries) != 3 || entries[0].Kind != "credit" {
		t.Fatalf("entries: %v %+v", err, entries)
	}
}
