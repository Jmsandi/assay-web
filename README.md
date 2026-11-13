# Assay client portal

The website where businesses sign up for Assay (ID verification for Sierra Leone), get API keys, watch usage and pay. The full product requirements are kept internally by Geneline-X.

**Status:** front end only, with demo data (`src/data/mock.ts`). Nothing is connected to the Assay API or a payment provider yet; prices are placeholders.

## Pages

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/login`, `/signup` | Sign in and sign up |
| `/app` | Overview: balance, spending cap, API keys, outcome counts and chart, recent verifications |
| `/app/verifications` | All sessions with outcomes (no identity data) |
| `/app/keys` | Create (shown once), rotate and revoke API keys |
| `/app/billing` | Balance, mobile money top-up (Orange Money, Afrimoney), transactions |
| `/app/webhooks` | Endpoint, signing secret, recent deliveries |
| `/app/settings` | Live access status, two-step sign-in, team |

Light and dark themes; works from 375 px phones (bottom tab bar) to wide desktops.

## Development

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then production build into dist/
```

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, React Router, lucide icons (the same base as the Capture app).

## Rules

- The portal never shows or stores identity data, images or verification details: counts, outcomes, key metadata and money only.
- API keys are shown once at creation and never stored by the portal.
- Payment details are entered only on the payment provider's hosted page.
