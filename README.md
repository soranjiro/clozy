# clozy

this app manages your clothes.

## Start

```bash
cd backend
npm run dev
```

```bash
cd frontend
yarn dev
```

## Deploy


### DB
```bash
cd backend
npx wrangler d1 execute clozy --remote --file=./db/migration.sql
# press y
```

### Worker
```bash
cd backend
npm run deploy
```

### Frontend
```bash
cd frontend
vercel --prod
```
