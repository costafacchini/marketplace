# Task: Deployment Config + Runbook

**Plan**: marketplace-filha
**Phase**: 5
**Task ID (phase-local)**: task-10
**Task Path**: phase-5/task-10-deploy
**Spec References**: SC-001 through SC-009 (all success criteria must pass before deploy), SDD section 10
**Depends On**: phase-3/task-07-cart, phase-4/task-09-admin-forms, phase-4/task-12-admin-pricelists
**JIRA**: N/A

## Objective

Configure the project for production deployment on Vercel + Railway: add `vercel.json`, document the complete environment setup, generate a deployment runbook in `docs/deploy.md`, update `CLAUDE.md` with key commands, and validate the end-to-end deploy.

## Context

Reference `docs/sdd.md` sections 10 (Deployment Architecture), 11 (Environment Variables), and 12 (Security Considerations).

This task does not write application code. It writes configuration and documentation, and verifies that the full app works in a production-like build.

Production deploy checklist (to encode in `docs/deploy.md`):
1. Railway: provision PostgreSQL, obtain `DATABASE_URL` with connection limit params
2. Cloudinary: create unsigned upload preset, note `CLOUD_NAME` and preset name
3. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
4. Generate `ADMIN_PASSWORD_HASH` with Node.js bcryptjs: `require('bcryptjs').hashSync('yourpassword', 12)`
5. Vercel: import repo, set all env vars from `.env.example`, deploy
6. Run `npx prisma migrate deploy` (via Railway CLI or Vercel build command)

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-3/task-07-cart` and `phase-4/task-09-admin-forms` are both `complete`
- [ ] Read `docs/sdd.md` sections 10, 11, and 12
- [ ] Run `npm run build` locally — must pass with 0 errors
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `vercel.json` | create | Vercel deployment configuration |
| `docs/deploy.md` | create | Step-by-step deployment runbook |
| `next.config.ts` | modify | Add security headers, verify Cloudinary image domain |
| `CLAUDE.md` | modify | Update Key commands and Deployment section |
| `prisma/seed.ts` | create | Optional: seed script for initial product data |

### Do NOT Modify

Any application source files (this task is config + docs only).

## Implementation Steps

### Step 1: Create vercel.json

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm ci"
}
```

This ensures Prisma client is generated and migrations run before the Next.js build on Vercel.

### Step 2: Add Security Headers to next.config.ts

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://upload-widget.cloudinary.com",
      "img-src 'self' data: https://res.cloudinary.com",
      "connect-src 'self' https://api.cloudinary.com",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

### Step 3: Create docs/deploy.md

Write a step-by-step deployment runbook covering:

1. **Prerequisites**: Node 18+, Railway account, Cloudinary account, Vercel account, GitHub repo
2. **Railway PostgreSQL Setup**: Create project → Add PostgreSQL service → Copy `DATABASE_URL` → Append `?connection_limit=1&pool_timeout=10`
3. **Cloudinary Setup**: Create unsigned upload preset → Note cloud name and preset name
4. **Generate Secrets**:
   - `NEXTAUTH_SECRET`: `openssl rand -base64 32`
   - `ADMIN_PASSWORD_HASH`: `node -e "const b = require('bcryptjs'); console.log(b.hashSync('YOUR_PASSWORD', 12))"`
5. **Vercel Deployment**:
   - Import GitHub repo
   - Framework preset: Next.js
   - Set all environment variables from `.env.example` with real values
   - Deploy
6. **Database Migration** (first deploy):
   - Vercel build command includes `prisma migrate deploy` — runs automatically
   - Verify via Railway console or Prisma Studio
7. **Smoke Tests**: Checklist of manual verifications after deploy
8. **Rollback**: How to redeploy previous Vercel deployment

### Step 4: Create Optional Seed Script (prisma/seed.ts)

Provide an example seed with 3 sample products (one per category) so the store is not empty on first load.

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

### Step 5: Post-Deploy Smoke Test Checklist

Encode in `docs/deploy.md` as a manual checklist:
- [ ] Homepage loads and shows products
- [ ] Category filter works
- [ ] Product detail page loads with images
- [ ] Add to cart and cart badge updates
- [ ] Cart page shows items and totals
- [ ] Confirm → WhatsApp URL opens with correct message
- [ ] `/login` with valid credentials redirects to `/admin`
- [ ] `/login` with invalid credentials shows error
- [ ] `/admin` without session redirects to `/login`
- [ ] Admin product table shows all products
- [ ] Active toggle updates product visibility in store
- [ ] Create product with photos works end-to-end
- [ ] Edit product works and changes persist
- [ ] Sort control (Menor preço / Promoções primeiro / A–Z) reorders vitrine correctly
- [ ] Create price list with % discount + date range + category scope
- [ ] Promo badge ("X% OFF") appears on covered product cards
- [ ] Promotional price shown (struck-through original) on vitrine and product detail
- [ ] WhatsApp message uses promotional price for covered products
- [ ] Deactivating price list removes discount from store immediately on next load
- [ ] Admin price list listing shows correct status badges (Ativa / Agendada / Expirada / Inativa)

### Step 6: Update CLAUDE.md

Update the Key commands section:
```
# npm run dev        # Dev server (localhost:3000)
# npm test           # Run Jest tests
# npm run lint       # ESLint
# npx prisma studio  # Browse database
# npx prisma migrate dev --name <name>  # Run dev migration
# npx prisma migrate deploy             # Run production migration
# npm run build      # Production build
```

## Testing

**Spec scenarios covered**: N/A — this task is deploy config and documentation.

**Additional verification**:
- [ ] `npm run build` passes locally with 0 TypeScript errors
- [ ] `npm run lint` passes with 0 errors
- [ ] All security headers present in Vercel preview deployment response
- [ ] `prisma migrate deploy` runs without errors in Vercel build log
- [ ] Smoke test checklist above passes on the deployed URL

## Documentation / KB Updates

- [ ] `docs/deploy.md` — created by this task
- [ ] No KB doc needed — deploy runbook is self-contained
- [ ] `CLAUDE.md` updated with commands
- [ ] Run `check-kb-index` after any KB changes

## Completion Criteria

- [ ] `npm run build` passes with 0 errors
- [ ] `vercel.json` is in place and Vercel build succeeds
- [ ] `docs/deploy.md` covers all deployment steps including secret generation
- [ ] Security headers are configured in `next.config.ts`
- [ ] Manual smoke test checklist passes on deployed URL
- [ ] All plan SC-001 through SC-006 verified on production URL
- [ ] Changes committed to `plan/marketplace-filha/phase-5/task-10-deploy` branch
- [ ] Status updated in `status.md`
