// Package core talks to Assay Core's private Partner Admin API (/admin/v1). The portal
// never reads Core's database and never receives identity data.
package core

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var (
	ErrNotFound    = errors.New("not found in core")
	ErrInvalid     = errors.New("core refused the request as invalid")
	ErrUnavailable = errors.New("core unavailable")
)

type Partner struct {
	PartnerID        string `json:"partner_id"`
	Mode             string `json:"mode"`
	RequestsPerMin   int    `json:"requests_per_minute"`
	Suspended        bool   `json:"suspended"`
	WebhookURL       string `json:"webhook_url"`
	WebhookSecretSet bool   `json:"webhook_secret_set"`
}

type Key struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Mode      string     `json:"mode"`
	Prefix    string     `json:"prefix"`
	Last4     string     `json:"last4"`
	CIDRs     []string   `json:"allowed_cidrs"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at"`
	LastUsed  *string    `json:"last_used_on"`
}

type DayUsage struct {
	Day        string `json:"day"`
	Created    int    `json:"sessions_created"`
	Decided    int    `json:"sessions_decided"`
	Approved   int    `json:"approved"`
	Review     int    `json:"review"`
	Retake     int    `json:"retake"`
	Rejected   int    `json:"rejected"`
	Unfinished int    `json:"unfinished"`
}

type BillableEvent struct {
	ID        string    `json:"id"`
	PartnerID string    `json:"partner_id"`
	Mode      string    `json:"mode"`
	SessionID string    `json:"session_id"`
	DecidedAt time.Time `json:"decided_at"`
	Outcome   string    `json:"outcome"`
}

// API is what the portal needs from Core; tests use a fake.
type API interface {
	UpsertPartner(ctx context.Context, actor, partnerID, mode string, perMinute int) (Partner, error)
	Partner(ctx context.Context, actor, partnerID, mode string) (Partner, error)
	SetSuspended(ctx context.Context, actor, partnerID, mode string, suspended bool) error
	IssueKey(ctx context.Context, actor, partnerID, mode, name string, expires time.Time, cidrs []string) (string, Key, error)
	ListKeys(ctx context.Context, actor, partnerID, mode string) ([]Key, error)
	RevokeKey(ctx context.Context, actor, partnerID, mode, keyID string) error
	SetWebhook(ctx context.Context, actor, partnerID, mode, url, secret string) error
	Usage(ctx context.Context, actor, partnerID, mode string, from, to time.Time) ([]DayUsage, error)
	BillableEvents(ctx context.Context, after string, limit int) ([]BillableEvent, string, error)
}

type Client struct {
	Base  string // e.g. http://10.116.0.4:8081 (private network only)
	Token string
	HTTP  *http.Client
}

func New(base, token string) *Client {
	return &Client{Base: strings.TrimRight(base, "/"), Token: token, HTTP: &http.Client{Timeout: 10 * time.Second}}
}

func (c *Client) do(ctx context.Context, actor, method, path string, body, out any) error {
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.Base+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("X-Portal-Actor", actor)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.HTTP.Do(req)
	if err != nil {
		return ErrUnavailable
	}
	defer func() { _ = res.Body.Close() }()
	switch {
	case res.StatusCode == 404:
		return ErrNotFound
	case res.StatusCode == 400:
		return ErrInvalid
	case res.StatusCode >= 300:
		return fmt.Errorf("%w: status %d", ErrUnavailable, res.StatusCode)
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(out)
}

func partnerPath(partnerID, mode string) string {
	return "/admin/v1/partners/" + url.PathEscape(partnerID) + "/" + url.PathEscape(mode)
}

func (c *Client) UpsertPartner(ctx context.Context, actor, partnerID, mode string, perMinute int) (Partner, error) {
	var p Partner
	err := c.do(ctx, actor, http.MethodPut, partnerPath(partnerID, mode), map[string]int{"requests_per_minute": perMinute}, &p)
	return p, err
}

func (c *Client) Partner(ctx context.Context, actor, partnerID, mode string) (Partner, error) {
	var p Partner
	err := c.do(ctx, actor, http.MethodGet, partnerPath(partnerID, mode), nil, &p)
	return p, err
}

func (c *Client) SetSuspended(ctx context.Context, actor, partnerID, mode string, suspended bool) error {
	return c.do(ctx, actor, http.MethodPut, partnerPath(partnerID, mode)+"/suspension", map[string]bool{"suspended": suspended}, nil)
}

func (c *Client) IssueKey(ctx context.Context, actor, partnerID, mode, name string, expires time.Time, cidrs []string) (string, Key, error) {
	if cidrs == nil {
		cidrs = []string{}
	}
	var out struct {
		Key  string `json:"key"`
		Info Key    `json:"info"`
	}
	err := c.do(ctx, actor, http.MethodPost, partnerPath(partnerID, mode)+"/keys", map[string]any{"name": name, "expires_at": expires.UTC(), "allowed_cidrs": cidrs}, &out)
	return out.Key, out.Info, err
}

func (c *Client) ListKeys(ctx context.Context, actor, partnerID, mode string) ([]Key, error) {
	var out struct {
		Keys []Key `json:"keys"`
	}
	err := c.do(ctx, actor, http.MethodGet, partnerPath(partnerID, mode)+"/keys", nil, &out)
	return out.Keys, err
}

func (c *Client) RevokeKey(ctx context.Context, actor, partnerID, mode, keyID string) error {
	return c.do(ctx, actor, http.MethodDelete, partnerPath(partnerID, mode)+"/keys/"+url.PathEscape(keyID), nil, nil)
}

func (c *Client) SetWebhook(ctx context.Context, actor, partnerID, mode, url, secret string) error {
	return c.do(ctx, actor, http.MethodPut, partnerPath(partnerID, mode)+"/webhook", map[string]string{"url": url, "secret": secret}, nil)
}

func (c *Client) Usage(ctx context.Context, actor, partnerID, mode string, from, to time.Time) ([]DayUsage, error) {
	var out struct {
		Days []DayUsage `json:"days"`
	}
	q := "?from=" + from.UTC().Format("2006-01-02") + "&to=" + to.UTC().Format("2006-01-02")
	err := c.do(ctx, actor, http.MethodGet, partnerPath(partnerID, mode)+"/usage"+q, nil, &out)
	return out.Days, err
}

func (c *Client) BillableEvents(ctx context.Context, after string, limit int) ([]BillableEvent, string, error) {
	var out struct {
		Events []BillableEvent `json:"events"`
		Next   string          `json:"next"`
	}
	err := c.do(ctx, "billing", http.MethodGet, fmt.Sprintf("/admin/v1/billable-events?after=%s&limit=%d", url.QueryEscape(after), limit), nil, &out)
	return out.Events, out.Next, err
}
