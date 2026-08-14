# Deployment

## Option A: a single VPS / VM (simplest for a SQLite-backed app)

1. `git clone` the project and `npm install`
2. Create `.env` with a strong `JWT_SECRET` and a writable `DATABASE_URL`
   (e.g. `file:/var/data/workplace/prod.db`)
3. `npm run db:seed` once, to create the schema (skip if you don't want demo data;
   the schema also applies automatically the first time the app runs)
4. `npm run build && npm run start` (or run behind `pm2`/`systemd` for restarts)
5. Put nginx/Caddy in front for TLS

SQLite is a single file, so back it up by copying that file. No dump/restore
tooling needed for a demo-scale deployment.

## Option B: Vercel (or another serverless platform)

Serverless platforms don't offer a persistent writable filesystem, which
SQLite needs. Either:
- Attach a persistent volume/disk if the platform supports it (e.g. Fly.io,
  Railway, Render all support this) and point `DATABASE_URL` at it, **or**
- Swap the repository layer to a hosted database (Postgres works well).
  see `docs/database.md` for what that involves.

## Option C: Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production
VOLUME ["/app/data"]
ENV DATABASE_URL="file:/app/data/prod.db"
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Mount a volume at `/app/data` so the SQLite file survives container restarts.

## Checklist before going live

- [ ] Strong, unique `JWT_SECRET`
- [ ] `DATABASE_URL` points at a persistent, writable path
- [ ] Real email delivery wired up if you want password reset to actually
      email users (currently it shows the link on-screen; see README)
- [ ] Consider a real payment gateway if EV charging payments need to be real
