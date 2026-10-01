# IntelliFarm AI

IntelliFarm AI is a farming assistant with crop disease detection, farm records, weather guidance, and an AI copilot. The web client is built with React and TypeScript. The API uses Express and stores application data in Supabase Postgres.

## Requirements

- Node.js 20 or newer
- A Supabase project
- Groq and OpenWeather API keys

## Local setup

Create the environment files from their examples if they do not exist:

```bash
[ -f client/.env ] || cp client/.env.example client/.env
[ -f server/.env ] || cp server/.env.example server/.env
```

Set the Supabase project URL and publishable key in `client/.env`. Set the same project URL and a server-only Supabase secret key in `server/.env`, along with the JWT, Groq, and OpenWeather values. Never put the server secret key in the client environment or commit `server/.env`.

The support form also needs `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in `server/.env`. Without them, the API reports that support email is unavailable instead of saying a message was sent when it was not.

Install dependencies and start the API and web client in separate terminals:

```bash
npm install --prefix server
npm run dev --prefix server
```

```bash
npm install --prefix client
npm start --prefix client
```

The client runs at `http://localhost:3000`; the API runs at `http://localhost:5001`. `npm run build` at the repository root builds the client. `npm start` at the root starts the API, which also serves `client/build` in production.

For a new database, run [server/supabase_schema.sql](server/supabase_schema.sql) and [server/supabase_copilot_v2_schema.sql](server/supabase_copilot_v2_schema.sql) in the Supabase SQL editor. Existing projects should use the migrations in `server/migrations` as needed.

## Docker Compose

Compose reads backend settings from `server/.env` and client settings from `client/.env` during the frontend build:

```bash
docker compose up --build
```

The Docker build excludes `server/.env`; Compose injects it at runtime. Client Supabase settings use a publishable key and are compiled into the browser bundle, so they must never contain a secret key.

## Main API routes

- `GET /api/health`
- `/api/auth` — registration, login, OAuth, and sessions
- `/api/profile` — profile and saved recommendations
- `/api/farms` — farm records
- `/api/crops` — crop recommendations and disease detection
- `/api/weather` — current weather, forecasts, and advisories
- `/api/copilot` — streamed assistant conversations
- `/api/support` — support messages
