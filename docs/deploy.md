# Deployment Runbook

**Stack**: Next.js 14 → Vercel · PostgreSQL → Railway · Images → Cloudinary

---

## Prerequisites

- Node.js 18+
- Railway account (https://railway.app)
- Cloudinary account (https://cloudinary.com)
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

---

## Step 1 — Railway PostgreSQL

1. Create a new Railway project
2. Add a **PostgreSQL** service
3. Open the service → **Connect** tab → copy the `DATABASE_URL`
4. Append connection limit params to avoid serverless overload:
   ```
   postgresql://user:pass@host:5432/dbname?connection_limit=1&pool_timeout=10
   ```
5. Save this as your `DATABASE_URL` env var in Vercel (Step 4)

---

## Step 2 — Cloudinary

1. Log in to Cloudinary → **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Set **Signing mode** to `Unsigned`
4. Choose a folder (e.g., `marketplace`)
5. Save — note the **Preset name** and your **Cloud name** (top-left in dashboard)

These become `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

---

## Step 3 — Generate Secrets

### NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### ADMIN_PASSWORD_HASH
```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('YOUR_PASSWORD', 12))"
```

Replace `YOUR_PASSWORD` with the actual admin password. Store the hash — never the plaintext password.

---

## Step 4 — Vercel Environment Variables

In Vercel → **Project Settings** → **Environment Variables**, set:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway connection string (with `?connection_limit=1&pool_timeout=10`) |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel production URL, e.g. `https://your-app.vercel.app` |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcryptjs hash from Step 3 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | From Step 2 |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | From Step 2 |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Full number with country code, e.g. `5511999999999` |
| `NEXT_PUBLIC_LOCALE` | `pt` for Brazilian Portuguese, `en` for English |

---

## Step 5 — Vercel Deployment

1. In Vercel, click **Add New** → **Project** → import the GitHub repository
2. Framework preset: **Next.js** (auto-detected)
3. The `vercel.json` in the repo sets the build command automatically:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
   This runs migrations before every build — safe to re-run (idempotent).
4. Click **Deploy**

---

## Step 6 — First Deploy: Database Migration

Migrations run automatically as part of the Vercel build command (`prisma migrate deploy`).

To verify:
- Check the Vercel build log for `All migrations have been successfully applied`
- Or connect via Railway CLI: `railway connect` → run `\dt` in psql to confirm tables

### Optional: Seed initial products

```bash
# Run locally against production DB (Railway)
DATABASE_URL="<railway-url>" npm run db:seed
```

---

## Step 7 — Smoke Test Checklist

Run after every production deploy:

**Store**
- [ ] Homepage (`/`) loads and shows product grid
- [ ] Category filter (Roupas / Íntimas / Academia) reorders correctly
- [ ] Sort control (Menor preço / Promoções / A–Z) reorders correctly
- [ ] Product detail page loads with images and size picker
- [ ] "Adicionar ao Carrinho" button adds item; cart badge count increments
- [ ] Cart page (`/cart`) shows items, qty controls work, total updates
- [ ] "Confirmar Pedido" opens confirmation modal
- [ ] "Enviar pelo WhatsApp" opens correct `wa.me` URL with formatted message
- [ ] Cart clears after WhatsApp redirect
- [ ] Promo badge ("X% OFF") appears on products covered by an active price list
- [ ] Promotional price (struck-through original) visible on product cards and detail page

**Admin**
- [ ] `/login` with valid credentials redirects to `/admin`
- [ ] `/login` with invalid credentials shows error message
- [ ] `/admin` without session redirects to `/login`
- [ ] Admin product table lists all products with status badges
- [ ] "Active" toggle immediately changes product visibility in the store
- [ ] "+ New Product" opens create form; submitting creates product and redirects
- [ ] Edit button opens edit form pre-filled with product data; saving updates persist
- [ ] Cloudinary widget opens, photo uploads, thumbnail appears in form
- [ ] Admin price lists table shows all lists with correct status badges
- [ ] Creating a price list with future start date shows "Scheduled" status
- [ ] Price list with active date range + product category applies discount in store

**Locale**
- [ ] With `NEXT_PUBLIC_LOCALE=pt` all UI labels appear in Portuguese
- [ ] With `NEXT_PUBLIC_LOCALE=en` all UI labels appear in English

---

## Rollback

In Vercel → **Deployments** → select a previous deployment → **Promote to Production**.

Database rollbacks require a manual migration. Never run `prisma migrate reset` in production.

---

## Environment Variable Reference

See `.env.example` in the repository root for the full list with placeholder values.
