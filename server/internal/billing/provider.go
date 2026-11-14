package billing

import (
	"context"
	"errors"
	"net/http"
)

// ErrPaymentsNotConfigured is returned until a provider (Monime) is set up.
var ErrPaymentsNotConfigured = errors.New("payments are not configured")

// Confirmation is what a provider says about one payment, after its webhook has been
// verified and the status re-read from the provider (never trusted from the browser).
type Confirmation struct {
	ProviderRef string
	// Status: completed, failed or expired.
	Status      string
	AmountCents int64
}

// Provider is a mobile money / card payment provider with a hosted checkout. The
// portal never handles PINs or card numbers.
type Provider interface {
	Name() string
	// StartTopUp creates a hosted checkout for the payment and returns the provider's
	// reference and the URL to send the user to.
	StartTopUp(ctx context.Context, p Payment, returnURL string) (ref, redirectURL string, err error)
	// Confirm verifies a webhook's signature, then re-reads the payment's status from
	// the provider's API.
	Confirm(ctx context.Context, r *http.Request) (Confirmation, error)
}

// None is the provider until Monime is configured: top-ups are refused clearly.
type None struct{}

func (None) Name() string { return "none" }
func (None) StartTopUp(context.Context, Payment, string) (string, string, error) {
	return "", "", ErrPaymentsNotConfigured
}
func (None) Confirm(context.Context, *http.Request) (Confirmation, error) {
	return Confirmation{}, ErrPaymentsNotConfigured
}
