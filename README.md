# OudTech Certificate Checker

Public certificate verification + admin registry for Oud Technologies, redesigned to match the [Academy](https://www.academy.oudtechnologies.com/intern) brand.

## Brand tokens (from Firecrawl)

| Token | Value |
| --- | --- |
| Primary | `#064ADF` |
| Navy | `#02143A` |
| Background | `#F8FAFC` |
| Font | Montserrat |
| Logo | `/public/brand/oudtech-logo.svg` |
| Favicon | `/public/favicon.ico` |

## Run locally

```bash
npm install
npm run dev
```

This starts:

- API on `http://localhost:3001`
- Vite app on `http://localhost:5173` (proxies `/api` → API)

**Default admin (from SQL dump):** username `admin` / password `123456`

## What you get

- **Public checker** (`/`) — brand-aligned verification UI
- **Admin sign-in** (`/admin/sign-in`) — split-screen layout matching [academy sign-in](https://www.academy.oudtechnologies.com/sign-in)
- **Admin dashboard** (`/admin`) — certificates list, create/edit, settings
- **Print** — prints only the certificate image (not the surrounding page)

## Database & Vercel

The SQL dump (`u663771390_cert.sql`) is **MariaDB/MySQL**. Vercel serverless functions do not ship with a durable local filesystem or long-lived DB connections, so:

### Recommended for Vercel

1. **Host MySQL remotely** (best fit for this schema):
   - Keep Hostinger/cPanel MariaDB, **or**
   - Move to [PlanetScale](https://planetscale.com), [Railway](https://railway.app), [Aiven](https://aiven.io), or [TiDB Cloud](https://www.pingcap.com/tidb-cloud/)
2. Set env vars in the Vercel project (see `.env.example`):
   - `JWT_SECRET`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`
   - or a single `DATABASE_URL=mysql://...`
3. Import `u663771390_cert.sql` into that database.
4. Deploy the Vite frontend + `/api` serverless routes to Vercel.

### Local / demo without MySQL

If no DB env vars are set, the API uses a **JSON file store** (`.data/store.json`) seeded from the dump. Fine for demos; not for production on Vercel (ephemeral filesystem).

### Image uploads on Vercel

Local uploads write to `public/certificates`. On Vercel that filesystem is **not persistent**. For production, point certificate images at:

- an existing Hostinger/CDN URL, or
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) / S3 / Cloudinary

The admin form already accepts a direct image URL/path.

### Why not Vercel Postgres by default?

Your existing schema and dump are MySQL. Staying on MySQL avoids a migration. If you prefer Neon/Vercel Postgres later, we can port the schema.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | API + Vite together |
| `npm run build` | Production frontend build |
| `npm run start:api` | API only |

## Field mapping (`tracking` → certificate)

| DB column | App field |
| --- | --- |
| `tracking_number` | Certificate ID |
| `receiver_name` | Student name |
| `receiver_email` | Student email |
| `receiver_contact` | Phone |
| `status` | Class / cohort |
| `dispatch_date` | Award date |
| `pdesc` | Notes |
| `image` | Certificate image |
