# agentRaider Web

Next.js pregled agenta agentRaider. Prikazuje lažne kupnje i prodaje, raspored
15-minutnih provjera te omogućuje promjenu taktike agenta.

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

- `/` — stanje novca i sljedeća provjera
- `/trades` — svi aktivni i završeni potezi
- `/journal` — bilješke agenta
- `/schedule` — raspored provjera vijesti
- `/settings` — strpljiva ili brza taktika i aktivni izvori

Agent čita Bloomberg, Reuters i Trading Economics. Strpljiva taktika dopušta
najviše 3 nova poteza u 7 dana, a brza najviše 3 u 24 sata.
