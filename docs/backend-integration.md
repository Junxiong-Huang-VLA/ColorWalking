# Backend Integration (Waitlist + Bridge + E2E)

## Local Start

```powershell
npm run dev:backend
```

Default service URL:

- `http://127.0.0.1:8787`

SQLite file:

- `apps/backend/data/colorwalking.db`

## Backend API (apps/backend)

- `GET /health`
- `GET /api/health`
- `POST /api/waitlist`
- `PATCH /api/waitlist/:id/status`
- `POST /api/waitlist/:id/retry`
- `POST /api/waitlist/:id/followup`
- `GET /api/waitlist`
- `POST /api/bridge/outputs`
- `GET /api/bridge/outputs`
- `GET /api/bridge/stream` (SSE)
- `POST /api/e2e/runs`
- `GET /api/e2e/latest`

## Production API Relay (Vercel)

Repository root now includes a Vercel function:

- `api/[...route].js`

It forwards `https://your-site/api/*` to the real backend and adds anti-abuse checks for `POST /api/waitlist`.

### Required Vercel Env

- `WAITLIST_BACKEND_URL` (required): real backend base URL
  - if value ends with `/api`, relay uses it directly
  - otherwise relay appends `/api`

### Optional Vercel Env

- `WAITLIST_BACKEND_TOKEN`: relay sends `Authorization: Bearer <token>` to backend
- `WAITLIST_RATE_LIMIT_WINDOW_MS` (default `60000`)
- `WAITLIST_RATE_LIMIT_MAX` (default `8`)
- `WAITLIST_RATE_LIMIT_BLOCK_MS` (default `600000`)
- `WAITLIST_CLIENT_AT_MAX_AGE_MS` (default `7200000`)
- `WAITLIST_CLIENT_AT_MAX_FUTURE_MS` (default `300000`)
- `WAITLIST_TURNSTILE_SECRET` (optional captcha)
- `WAITLIST_TURNSTILE_REQUIRED` (`1` to force captcha token)

## Backend Hardening Env (apps/backend)

- `CW_API_TOKEN`: require Bearer token on write APIs
- `CW_WAITLIST_RATE_LIMIT_WINDOW_MS` (default `60000`)
- `CW_WAITLIST_RATE_LIMIT_MAX` (default `10`)
- `CW_WAITLIST_RATE_LIMIT_BLOCK_MS` (default `600000`)
- `CW_WAITLIST_CLIENT_AT_MAX_AGE_MS` (default `7200000`)
- `CW_WAITLIST_CLIENT_AT_MAX_FUTURE_MS` (default `300000`)
- `CW_FOLLOWUP_WEBHOOK_URL`
- `CW_BRIDGE_WEBHOOK_URL`

## Frontend Env

- `VITE_API_BASE_URL`: frontend API base (default local `http://127.0.0.1:8787/api`, production `/api`)

## Verification

### Local closure

```powershell
pnpm run local:demo
pnpm run local:check
```

### Real domain waitlist relay

```powershell
pnpm run test:waitlist:live
```

Optional target override:

```powershell
$env:WAITLIST_VERIFY_SITE_URL='https://www.colorful-lamb-rolls.cloud'
pnpm run test:waitlist:live
```

## CI

Workflow: `.github/workflows/site-e2e-baseline.yml`

- runs Playwright baseline
- uploads HTML report artifact
- uploads JUnit artifact
