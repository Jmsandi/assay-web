// Command portal runs the Assay client portal: the /api backend and the built web app.
//
//	portal serve     run the server (migrates first)
//	portal migrate   apply database migrations and exit
//	portal health    exit 0 if the local server answers /healthz (container check)
//
// Configuration (environment):
//
//	DATABASE_URL        portal database (its own database and login)
//	CORE_ADMIN_URL      Core's private listener, e.g. http://10.116.0.4:8081
//	CORE_ADMIN_TOKEN    Core's PORTAL_ADMIN_TOKEN
//	PUBLIC_ORIGIN       e.g. https://portal.geneline-x.net (requests from elsewhere are refused)
//	WEB_DIR             built front end (default ./dist)
//	LISTEN_ADDR         default 0.0.0.0:8090
//	INSECURE_COOKIES    "true" only for local development over http
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Jmsandi/assay-web/server/internal/api"
	"github.com/Jmsandi/assay-web/server/internal/core"
	"github.com/Jmsandi/assay-web/server/internal/store"
	"github.com/Jmsandi/assay-web/server/internal/web"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	command := "serve"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}
	addr := env("LISTEN_ADDR", "0.0.0.0:8090")
	if command == "health" {
		res, err := (&http.Client{Timeout: 3 * time.Second}).Get("http://127.0.0.1" + portOf(addr) + "/healthz")
		if err != nil || res.StatusCode != 200 {
			os.Exit(1)
		}
		return
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	pool, err := pgxpool.New(ctx, mustEnv("DATABASE_URL"))
	if err != nil {
		log.Fatal("database configuration invalid")
	}
	defer pool.Close()
	if err = store.Migrate(ctx, pool); err != nil {
		log.Fatal(err)
	}
	if command == "migrate" {
		log.Print("migrations applied")
		return
	}
	if command != "serve" {
		log.Fatal("unknown command")
	}

	origin := mustEnv("PUBLIC_ORIGIN")
	if u, err := url.Parse(origin); err != nil || u.Host == "" || u.Path != "" {
		log.Fatal("PUBLIC_ORIGIN must be an origin like https://portal.example.com")
	}
	token := mustEnv("CORE_ADMIN_TOKEN")
	if len(token) < 32 {
		log.Fatal("CORE_ADMIN_TOKEN must be at least 32 characters")
	}
	srv := &api.Server{
		Store:         store.Postgres{Pool: pool},
		Core:          core.New(mustEnv("CORE_ADMIN_URL"), token),
		Origin:        origin,
		SecureCookies: os.Getenv("INSECURE_COOKIES") != "true",
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		if pool.Ping(r.Context()) != nil {
			w.WriteHeader(503)
			return
		}
		w.WriteHeader(200)
	})
	srv.Routes(mux)
	mux.Handle("/", web.SPA(env("WEB_DIR", "dist")))

	httpServer := &http.Server{Addr: addr, Handler: web.Headers(mux), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16 << 10}
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = httpServer.Shutdown(shutdown)
	}()
	log.Printf("portal listening on %s", addr)
	if err = httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func env(name, fallback string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return fallback
}

func mustEnv(name string) string {
	v := os.Getenv(name)
	if v == "" {
		log.Fatalf("%s is required", name)
	}
	return v
}

func portOf(addr string) string {
	for i := len(addr) - 1; i >= 0; i-- {
		if addr[i] == ':' {
			return addr[i:]
		}
	}
	return ":8090"
}
