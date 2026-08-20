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

## Database (Supabase Postgres)

Use **Supabase** for production (works well with Vercel serverless).

### 1. Create the schema

1. Open [Supabase](https://supabase.com) → your project → **SQL Editor**
2. Paste and run [`supabase/schema.sql`](./supabase/schema.sql)

That creates `admin`, `settings`, `tracking` (certificates), and `track_update`, and seeds sample data.

### 2. Copy the connection string

Supabase → **Project Settings → Database → Connection string → URI**

Prefer the **Transaction pooler** (port **6543**) for Vercel.

### 3. Set Vercel env vars

| Name | Value |
| --- | --- |
| `JWT_SECRET` | long random string |
| `DATABASE_URL` | your Supabase pooler URI |

Optional: `DB_CONNECTION_LIMIT=3`

Redeploy after saving.

### 4. Confirm

`https://YOUR_DOMAIN/api/health` should return:

```json
{ "ok": true, "dbMode": "postgres" }
```

**Default admin:** `admin` / `123456` (bcrypt-hashed in the seed — change it after first login)

### Local / demo without Postgres

If no DB env vars are set, the API uses a JSON file store (`.data/store.json`). Fine for demos only.

### Image uploads on Vercel

Local uploads write to `public/certificates`. On Vercel that filesystem is **not persistent**. For production, store images in **Supabase Storage** (or Blob/CDN) and save the public URL on the certificate record. The admin form already accepts a direct image URL.

The old MariaDB dump (`u663771390_cert.sql`) is kept for reference only — do not import it into Supabase.

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
