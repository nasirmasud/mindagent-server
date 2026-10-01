# MindAgent Server

Express + TypeScript backend for the MindAgent AI platform.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your env vars
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `IMAGEBB_API_KEY` | No | ImageBB key for avatar uploads (`POST /api/upload/avatar`). Server-side only - never expose as `NEXT_PUBLIC_*`. |
| `ENABLE_DEMO_LOGIN` | No | Set to exactly `true` to enable `POST /api/auth/demo-login`. Anything else (including `1` or `TRUE`) leaves it disabled. |
| `PORT` | No | Server port (default: 5000) |

## Demo Login

Disabled by default. When `ENABLE_DEMO_LOGIN=true`:

- `POST /api/auth/demo-login` issues a JWT for the `demo@mindagent.ai` account, creating and
  seeding it on first use. No password is set on that account.
- Otherwise the endpoint returns `404 Not found`.
- `GET /api/auth/config` reports `{ demoEnabled: boolean }` so the client can hide the button.

Anyone who can reach the endpoint gets a working session, so only enable it where that is
acceptable. It is rate limited but not authenticated.

## Password Policy

New passwords must be **12-72 characters** and contain an upper case letter, a lower case
letter, a digit, and a symbol. This applies to registration and to `PUT /api/auth/password`.

Login deliberately does **not** apply these rules, so accounts created under the old,
shorter policy can still sign in. The 72-character ceiling matches the limit at which
bcrypt stops reading input, so a longer password is not a stronger one.

The demo account is seeded with the password in `SEED_DEMO_PASSWORD` - there is no
built-in default, and `npm run seed` fails without it.

## Roles

Users have `role: "user" | "admin"` (default `user`). The role is read from the database
on every authenticated request rather than trusted from the JWT, so changing it takes
effect immediately. `requireRole()` and `requireAdmin()` are available in
`src/middleware/protect.ts` for route-level authorization.

Grant or revoke admin explicitly:

```bash
npm run promote:admin -- you@example.com
npm run promote:admin -- you@example.com --revoke
```

The script only updates an existing account - it will not create one - and refuses to act
if the email matches more than one account.

## Admin Stats

`GET /api/admin/stats` returns user counts and requires a token belonging to an account
with `role: "admin"`:

```json
{ "success": true, "stats": { "totalUsers": 42, "emailUsers": 30, "googleUsers": 12, "admins": 1, "demoUsers": 1, "newThisWeek": 5 } }
```

`newThisWeek` counts accounts created in the last 7 days. `demoUsers` counts the
`demo@mindagent.ai` account created by `npm run seed` or `POST /api/auth/demo-login`,
which is included in `totalUsers` - subtract it for a real registration count.

The role is read from the database on every request, so promoting an account takes effect
on the next call without needing a fresh token.

## Avatar Uploads

`POST /api/upload/avatar` proxies an image to ImageBB using the server-side
`IMAGEBB_API_KEY`. It is mounted before authentication because avatars are uploaded during
registration, before a token exists, which makes it the only unauthenticated write path in
the API. It is rate limited (10 per 15 minutes), capped at 2MB, restricted to PNG/JPEG/WebP/GIF,
and the real file content is checked against the declared type so arbitrary files cannot be
parked on a public CDN. Never expose this key as a `NEXT_PUBLIC_*` variable.

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/demo-login` | Instant demo login (requires `ENABLE_DEMO_LOGIN=true`) |
| GET | `/api/auth/config` | Public feature flags |
| POST | `/api/auth/google` | Google OAuth login (verifies the Google ID token) |
| POST | `/api/upload/avatar` | Upload an avatar to ImageBB (rate limited, unauthenticated by necessity) |
| GET | `/api/agents` | List agents (search, filter, sort, paginate) |
| GET | `/api/agents/:id` | Agent detail |
| GET | `/api/items` | List items |
| POST | `/api/items` | Create item (protected) |
| PUT | `/api/items/:id` | Update item (owner only) |
| DELETE | `/api/items/:id` | Delete item (owner only) |
| POST | `/api/ai/generate-content` | Generate AI content |
| POST | `/api/ai/chat` | Streaming AI chat |
| GET | `/api/chat-sessions` | List chat sessions |
| GET | `/api/recommendations` | Recommended agents |
| GET | `/api/admin/stats` | User counts (requires admin role) |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/data-analysis/upload` | Upload CSV/XLSX/JSON |
| POST | `/api/data-analysis/:id/analyze` | Run AI analysis |
| GET | `/api/data-analysis` | List analysis history |
| GET | `/api/data-analysis/:id` | Get single analysis |
| GET | `/api/data-analysis/:id/report` | Download Excel report |
