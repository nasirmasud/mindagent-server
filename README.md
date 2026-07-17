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
| `PORT` | No | Server port (default: 5000) |

## Demo Login

- Email: `demo@mindagent.ai`
- No password needed — use `POST /api/auth/demo-login`

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/demo-login` | Instant demo login |
| POST | `/api/auth/google` | Google OAuth login |
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
| POST | `/api/contact` | Submit contact form |
| POST | `/api/data-analysis/upload` | Upload CSV/XLSX/JSON |
| POST | `/api/data-analysis/:id/analyze` | Run AI analysis |
| GET | `/api/data-analysis` | List analysis history |
| GET | `/api/data-analysis/:id` | Get single analysis |
| GET | `/api/data-analysis/:id/report` | Download Excel report |
