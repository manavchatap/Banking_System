# NexaBank Frontend

Professional React frontend for the NexaBank banking backend.

## Stack

- **React 19** + **Vite 8**
- **React Router v7** — client-side routing
- **Axios** — API client with cookie credential support
- **Lucide React** — icon set
- **CSS Modules** — scoped, zero-dependency styling

## Getting started

### 1. Start the backend

```bash
# From the bank/ root
npm run dev
# Backend runs on http://localhost:3000
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in with email + password |
| `/register` | Create a new account |
| `/dashboard` | Overview: total balance, all accounts, quick actions |
| `/accounts` | Full accounts table with live balances |
| `/transfer` | Multi-step transfer form with confirmation |

## Notes

- The Vite dev server proxies `/auth`, `/accounts`, `/transactions` to `localhost:3000`, so no CORS config is needed in development.
- Auth state is persisted in `localStorage` and synced with JWT cookies.
- The transfer flow generates a unique idempotency key per attempt, preventing duplicate transactions on retry.
