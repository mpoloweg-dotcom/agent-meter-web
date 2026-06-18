# Agent Meter Web

Next.js dashboard za praćenje Agent Meter paper-trading agenta.

## Setup

```bash
npm install
cp .env.example .env.local
# unesi DATABASE_URL u .env.local
npm run dev
```

Otvori http://localhost:3000

## Deploy na Vercel

1. Pushaj ovaj folder na GitHub repo
2. Na vercel.com → New Project → importaj repo
3. U Environment Variables dodaj:
   - `DATABASE_URL` — Railway Postgres connection string
   - `INITIAL_CAPITAL_EUR` — npr. `1000`
4. Deploy

## Stranice

- `/` — kapital, P&L, otvorene pozicije, sljedeće buđenje
- `/trades` — tablica svih trade-ova s P&L
- `/journal` — agent journal bilješke
- `/schedule` — raspored buđenja agenta
