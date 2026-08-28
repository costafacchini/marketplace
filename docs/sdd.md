# Software Design Document — Small Business Seller

**Version**: 1.0  
**Created**: 2026-08-28  
**Source of requirements**: [`spec.md`](../spec.md) · [`plans/small-business-seller/spec.md`](../plans/small-business-seller/spec.md)  
**Status**: Approved — authoritative reference for all implementation tasks (phases 1–5)

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Model](#3-data-model)
4. [API Contracts](#4-api-contracts)
5. [Authentication Design](#5-authentication-design)
6. [State Management](#6-state-management)
7. [Cloudinary Integration](#7-cloudinary-integration)
8. [WhatsApp Checkout Flow](#8-whatsapp-checkout-flow)
9. [Component Hierarchy](#9-component-hierarchy)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Environment Variables](#11-environment-variables)
12. [Security Considerations](#12-security-considerations)
13. [Internationalization (i18n)](#13-internationalization-i18n)
14. [Testing Strategy](#14-testing-strategy)

---

## 1. Overview

Small Business Seller is a single-seller clothing marketplace built for a Brazilian retailer. Customers browse a product catalog, build a cart, and submit orders via WhatsApp — the seller closes each sale manually. The seller manages the catalog and promotional pricing through a protected admin panel.

**Stakeholders**:
- **Customer** — browses and orders via mobile browser; requires no account
- **Seller (admin)** — manages products and price lists via authenticated panel

**V1 scope summary**: product catalog with category/sort filtering, promotional price lists, client-side cart, WhatsApp checkout, single-user admin with Cloudinary photo upload, English/Portuguese UI via env var.

**Explicit out of scope for v1**: payment gateway, customer accounts, order persistence, stock management, multiple admin users, push/email notifications.

---

## 2. System Architecture

### High-Level Topology

```
Browser (Customer / Admin)
    │
    ├── Store pages (SSR)       app/(store)/
    │       └── Prisma ─────────────── PostgreSQL (Railway)
    │
    ├── Admin pages (SSR)       app/(admin)/      ← protected by middleware.ts
    │       └── Prisma ─────────────── PostgreSQL (Railway)
    │
    ├── API Routes              app/api/
    │       └── Prisma ─────────────── PostgreSQL (Railway)
    │
    ├── Cloudinary Widget ──────────── Cloudinary CDN  (browser → cloud direct)
    └── WhatsApp deep link ─────────── wa.me (external)

Deployment: Vercel (Next.js) + Railway (PostgreSQL)
```

### Request Flows

**Customer browse flow**:
1. Browser → `GET /` (Vercel Edge → Next.js Server Component)
2. Server Component calls `prisma.product.findMany({ where: { active: true } })` and `getActivePriceLists()`
3. Products serialized (Decimal → string) and passed to `CategoryFilter` Client Component
4. Client-side filtering + sorting with `useState` / `sortProducts()` — no additional network request
5. HTML rendered and streamed to browser

**Admin product create flow**:
1. Admin → `POST /api/products` (authenticated, validated via zod)
2. API route checks `getServerSession(authOptions)` → 401 if unauthenticated
3. Prisma `product.create()` → Railway PostgreSQL
4. Photos already uploaded to Cloudinary at this point (widget handled it); only URLs stored

**WhatsApp checkout flow**:
1. Customer clicks "Confirm Order" → confirmation modal shown (FR-010)
2. Customer clicks "Send via WhatsApp" → `buildWhatsAppUrl(items)` called in browser
3. `encodeURIComponent(message)` appended to `wa.me/{WHATSAPP_NUMBER}`
4. `window.open(url, '_blank')` opens WhatsApp (app or web fallback)

### Route Group Strategy

| Group | Path | Auth | Notes |
|-------|------|------|-------|
| `(store)` | `/`, `/products/[id]`, `/cart` | None | Public; SSR with Prisma direct |
| `(admin)` | `/login`, `/admin/**` | NextAuth session | Protected by `middleware.ts` |
| `api/` | `/api/**` | Per-route (mutations require session) | REST handlers |

---

## 3. Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id             String          @id @default(cuid())
  name           String
  description    String?
  price          Decimal         @db.Decimal(10, 2)   // base price, never mutated by promotions
  category       Category
  sizes          String[]                              // e.g. ["P", "M", "G", "GG"]
  images         String[]                              // Cloudinary URLs, ordered
  active         Boolean         @default(true)        // soft-delete flag
  priceListItems PriceListItem[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model PriceList {
  id          String          @id @default(cuid())
  name        String
  discountPct Decimal         @db.Decimal(5, 2)        // 0.00–100.00
  startsAt    DateTime
  expiresAt   DateTime
  active      Boolean         @default(true)            // manual on/off switch
  categories  Category[]                                // empty = no category-level coverage
  items       PriceListItem[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model PriceListItem {
  id          String    @id @default(cuid())
  priceList   PriceList @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  priceListId String
  product     Product   @relation(fields: [productId], references: [id])
  productId   String
  discountPct Decimal?  @db.Decimal(5, 2)              // overrides PriceList.discountPct when set

  @@unique([priceListId, productId])
}

enum Category {
  CLOTHES
  LINGERIE
  WORKOUT
}
```

**Field notes**:
- `price`: stored as `Decimal(10,2)` — must be serialized to `string` before passing to Client Components; convert back with `Number()` only for arithmetic
- `images`: ordered array; first element is the card thumbnail
- `sizes`: free-form strings defined by the seller; the UI renders them as-is
- `active` on `Product`: soft-delete — `false` hides from store, admin still sees it
- `active` on `PriceList`: manual toggle; must also be within `[startsAt, expiresAt]` to apply

---

## 4. API Contracts

### Products

#### `GET /api/products`

Query params: `?active=true` (boolean) · `?category=CLOTHES|LINGERIE|WORKOUT`

```
200 OK
{
  "products": [
    {
      "id": "cuid",
      "name": "string",
      "description": "string | null",
      "price": "string",          // Decimal serialized to string
      "category": "CLOTHES",
      "sizes": ["P", "M", "G"],
      "images": ["https://res.cloudinary.com/..."],
      "active": true,
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

#### `POST /api/products` *(admin only)*

Request body (validated with zod):
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number > 0 (required)",
  "category": "CLOTHES | LINGERIE | WORKOUT (required)",
  "sizes": ["string"] (min 1 item, required)",
  "images": ["url string"] (min 1 item, required)",
  "active": "boolean (default true)"
}
```

```
201 Created  →  { "product": Product }
400 Bad Request  →  { "error": "string", "details": ZodIssue[] }
401 Unauthorized  →  { "error": "Unauthorized" }
```

#### `GET /api/products/[id]`

```
200 OK  →  { "product": Product }
404 Not Found  →  { "error": "Not found" }
```

#### `PUT /api/products/[id]` *(admin only)*

Same body shape as POST (all fields optional for partial update).

```
200 OK  →  { "product": Product }
400 Bad Request  →  { "error": "...", "details": ZodIssue[] }
401 Unauthorized
404 Not Found
```

---

### Price Lists

#### `GET /api/price-lists`

```
200 OK
{
  "priceLists": [
    {
      "id": "cuid",
      "name": "string",
      "discountPct": "string",
      "startsAt": "ISO8601",
      "expiresAt": "ISO8601",
      "active": true,
      "categories": ["CLOTHES"],
      "items": [{ "productId": "cuid", "discountPct": "string | null" }],
      "createdAt": "ISO8601"
    }
  ]
}
```

#### `POST /api/price-lists` *(admin only)*

```json
{
  "name": "string (required)",
  "discountPct": "number 0–100 (required)",
  "startsAt": "ISO8601 (required)",
  "expiresAt": "ISO8601 (required, must be after startsAt)",
  "active": "boolean (default true)",
  "categories": ["CLOTHES | LINGERIE | WORKOUT"] (optional)",
  "productIds": ["cuid"] (optional, specific product overrides)",
  "itemOverrides": { "productId": "discountPct number" } (optional)"
}
```

```
201 Created  →  { "priceList": PriceList }
400 Bad Request  →  { "error": "...", "details": ZodIssue[] }
401 Unauthorized
```

#### `GET /api/price-lists/[id]`

```
200 OK  →  { "priceList": PriceList }
404 Not Found
```

#### `PUT /api/price-lists/[id]` *(admin only)*

Same shape as POST. `items` are replaced atomically via transaction (deleteMany + createMany).

```
200 OK  →  { "priceList": PriceList }
400 | 401 | 404
```

---

### Auth

Handled by NextAuth.js — no custom routes needed beyond the catch-all:

```
POST /api/auth/callback/credentials  →  NextAuth Credentials login
GET  /api/auth/session               →  Current session (JWT)
POST /api/auth/signout               →  Destroy session
```

---

## 5. Authentication Design

- **Provider**: NextAuth.js Credentials strategy (`next-auth`)
- **Validation**: Compare submitted email against `ADMIN_EMAIL` env var; compare submitted password against `ADMIN_PASSWORD_HASH` using `bcryptjs.compare()`
- **Why `bcryptjs`**: Pure JavaScript implementation — avoids native module compilation issues on Vercel serverless
- **Session strategy**: JWT (stateless — no `Session` table in the database)
- **Session `maxAge`**: 8 hours
- **Auth config location**: `lib/auth.ts` (exports `authOptions`)
- **Route protection**: `middleware.ts` at project root, matcher: `['/admin/:path*']`; redirects to `/login` if no valid session

```typescript
// middleware.ts
export { default } from 'next-auth/middleware'
export const config = { matcher: ['/admin/:path*'] }
```

- **Login route**: `app/(admin)/login/page.tsx`
- **Admin password generation** (offline, before deploy):
  ```bash
  node -e "const b = require('bcryptjs'); console.log(b.hashSync('YOUR_PASSWORD', 12))"
  ```

---

## 6. State Management

### Cart Store (Zustand)

```typescript
// store/cart.ts

interface CartItem {
  productId: string
  name: string
  size: string
  price: number       // promotional price if active, otherwise base price — snapshotted at add-to-cart time
  quantity: number
  image: string       // first image URL
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void  // increments qty if (productId + size) already in cart
  removeItem: (productId: string, size: string) => void
  updateQty: (productId: string, size: string, qty: number) => void
  clear: () => void
  total: () => number   // sum of item.price * item.quantity
}
```

**Persistence**:
- Middleware: `zustand/middleware` `persist`
- Storage key: `small-business-seller-cart`
- Storage: `localStorage` (browser-only; no SSR hydration needed)

**Price snapshotting**: The effective price (promotional or base) is resolved server-side and passed to the client. The cart stores the price at the time of adding — if a price list expires after the customer adds an item, the cart retains the old price. This is accepted behavior for v1; the seller verifies at close of sale.

---

## 7. Cloudinary Integration

- **Upload mechanism**: Cloudinary Upload Widget (CDN JavaScript widget — browser → Cloudinary direct)
- **No server-side upload proxy**: the server never handles image bytes; it only stores resulting URLs
- **Widget loading**: dynamic import or CDN `<script>` tag added in the Cloudinary widget component
- **Upload preset**: unsigned preset configured in the Cloudinary dashboard (no API secret required in client)
- **Env vars** (client-accessible):
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — cloud name
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — unsigned preset name

```typescript
// components/admin/CloudinaryWidget.tsx pattern
window.cloudinary.openUploadWidget(
  {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    sources: ['local', 'camera'],
    resourceType: 'image',
    multiple: true,
  },
  (error, result) => {
    if (result.event === 'success') {
      onUpload(result.info.secure_url)
    }
  }
)
```

**CSP requirement**: `Content-Security-Policy` must allow `https://upload-widget.cloudinary.com` for `script-src` and `https://res.cloudinary.com` for `img-src`.

---

## 8. WhatsApp Checkout Flow

### Flow Sequence

```
CartPage → "Confirm Order" → ConfirmModal → "Send via WhatsApp" → wa.me URL → WhatsApp
```

1. Customer reviews cart on `/cart`
2. Clicks "Confirm Order" → `ConfirmModal` appears with text: *"You will be redirected to WhatsApp to finalize the order with the seller."* (from translation file)
3. Customer clicks "Send via WhatsApp" → `buildWhatsAppUrl(items)` executes in browser
4. URL opens in new tab (`window.open(url, '_blank')`)

### Message Format

```
lib/whatsapp.ts — buildWhatsAppUrl(items: CartItem[]): string
```

The message body (content from translation files for the header; product lines are data):
```
Hello! I would like to order:

- {name} Size {size} × {qty} — R$ {price}
...

Estimated total: R$ {total}
```

```typescript
export function buildWhatsAppUrl(items: CartItem[], t: (key: string) => string): string {
  const lines = items.map(
    item => `- ${item.name} ${t('cart.size')} ${item.size} × ${item.quantity} — R$ ${formatPrice(item.price * item.quantity)}`
  )
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const message = [
    t('cart.whatsappGreeting'),
    '',
    ...lines,
    '',
    `${t('cart.estimatedTotal')}: R$ ${formatPrice(total)}`,
  ].join('\n')
  return `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
```

**Mobile behavior**: `wa.me` opens the WhatsApp native app if installed; falls back to `web.whatsapp.com` on desktop.

---

## 9. Component Hierarchy

```
app/
├── layout.tsx                      Root layout — NextIntlClientProvider, fonts
├── (store)/
│   ├── layout.tsx                  Store layout — Navbar (cart badge)
│   ├── page.tsx                    VitrinePage (Server Component)
│   │   ├── ProductGrid.tsx         Grid container (grid-cols-2 sm:3 lg:4)
│   │   │   └── ProductCard.tsx     Card with promo badge overlay
│   │   ├── CategoryFilter.tsx      Client — tab state (CLOTHES | LINGERIE | WORKOUT | ALL)
│   │   └── SortControl.tsx         Client — sort dropdown (PROMO_FIRST | PRICE_ASC | NAME_ASC)
│   ├── products/[id]/page.tsx      ProductDetailPage (Server Component)
│   │   ├── ImageGallery.tsx        Main image + thumbnail strip
│   │   ├── SizePicker.tsx          Size button group (min-h-[44px])
│   │   └── AddToCartButton.tsx     Client — writes to Zustand cart
│   └── cart/page.tsx               CartPage (Client Component)
│       ├── CartItemRow.tsx         Qty controls (min-h-[44px]) + remove
│       ├── OrderSummary.tsx        Subtotals + grand total
│       └── ConfirmModal.tsx        Pre-redirect WhatsApp confirmation
│
├── (admin)/
│   ├── layout.tsx                  Admin layout — nav (Products | Price Lists | Sign Out)
│   ├── login/page.tsx              LoginForm (react-hook-form + zod)
│   └── admin/
│       ├── page.tsx                AdminProductTable (Server Component)
│       │   ├── ProductTable.tsx    Table: name | category | price | status | actions
│       │   └── ActiveToggle.tsx    Client — PATCH active via PUT /api/products/[id]
│       ├── products/new/page.tsx   ProductForm (create mode)
│       ├── products/[id]/edit/page.tsx  ProductForm (edit mode)
│       │   ├── ProductForm.tsx     react-hook-form + zod + CloudinaryWidget
│       │   └── CloudinaryWidget.tsx Client — Cloudinary Upload Widget wrapper
│       ├── price-lists/page.tsx    PriceListsPage (Server Component)
│       │   ├── PriceListTable.tsx  Table: name | discount | dates | scope | status | actions
│       │   └── ActivePriceListToggle.tsx  Client — toggle active via PUT /api/price-lists/[id]
│       ├── price-lists/new/page.tsx       PriceListForm (create mode)
│       └── price-lists/[id]/edit/page.tsx PriceListForm (edit mode)
│           ├── PriceListForm.tsx   react-hook-form + zod + ProductSelector
│           └── ProductSelector.tsx Client — multi-select with per-product discount override

components/
├── ui/                             shadcn/ui primitives (Button, Card, Badge, Input, Label,
│                                   Tabs, Dialog, Select, Switch, Checkbox)
├── store/                          Customer-facing components (listed above)
└── admin/                          Admin components (listed above)

store/
└── cart.ts                         Zustand store + persist middleware

lib/
├── prisma.ts                       Prisma client singleton
├── auth.ts                         NextAuth authOptions
├── pricing.ts                      getActivePriceLists() + resolvePrice() — centralized
├── whatsapp.ts                     buildWhatsAppUrl() + formatPrice()
└── validations/
    ├── product.ts                  Zod schemas: productCreateSchema, productUpdateSchema
    └── pricelist.ts                Zod schemas: priceListCreateSchema, priceListUpdateSchema

middleware.ts                        Route protection — /admin/:path* → /login

i18n.ts                             next-intl config — reads NEXT_PUBLIC_LOCALE
messages/
├── en.json                         English translations
└── pt.json                         Brazilian Portuguese translations
```

---

## 10. Deployment Architecture

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploy from `main`; framework preset: Next.js |
| Database | Railway PostgreSQL | Free tier (1 GB); connection limit required for serverless |
| Images | Cloudinary | Free tier (25 GB); unsigned upload preset |

**Build command on Vercel**:
```bash
prisma generate && prisma migrate deploy && next build
```

**`DATABASE_URL` for serverless**: must include `?connection_limit=1&pool_timeout=10` to avoid connection exhaustion from concurrent Vercel function instances.

**Prisma singleton** (`lib/prisma.ts`): caches the PrismaClient instance on `globalThis` in development to survive hot-reload without exhausting connections.

**Cold start mitigation**: Vercel Edge Network + Railway free tier may introduce cold starts (~1–2s). No explicit mitigation in v1; acceptable for the expected traffic.

---

## 11. Environment Variables

| Variable | Required | Scope | How to obtain | Example |
|----------|----------|-------|---------------|---------|
| `DATABASE_URL` | Yes | Server | Railway → Connect → PostgreSQL connection string | `postgresql://user:pass@host:5432/db?connection_limit=1&pool_timeout=10` |
| `NEXTAUTH_SECRET` | Yes | Server | `openssl rand -base64 32` | `abc123...` |
| `NEXTAUTH_URL` | Yes | Server | Vercel deployment URL | `https://small-business-seller.vercel.app` |
| `ADMIN_EMAIL` | Yes | Server | Set manually | `seller@example.com` |
| `ADMIN_PASSWORD_HASH` | Yes | Server | `node -e "require('bcryptjs').hashSync('pwd', 12)"` | `$2a$12$...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Client | Cloudinary dashboard → Cloud Name | `my-cloud` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | Client | Cloudinary → Settings → Upload → Presets | `marketplace_unsigned` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | Client | Seller's WhatsApp number | `5511999999999` |
| `NEXT_PUBLIC_LOCALE` | No | Client | `en` (default) or `pt` | `pt` |

**Client vs server scope**: Variables prefixed with `NEXT_PUBLIC_` are embedded in the JavaScript bundle at build time and visible to the browser. Never expose secrets (`NEXTAUTH_SECRET`, `ADMIN_PASSWORD_HASH`, `DATABASE_URL`) with the `NEXT_PUBLIC_` prefix.

---

## 12. Security Considerations

1. **Password storage**: `ADMIN_PASSWORD_HASH` is a bcrypt hash (cost 12) stored as an env var — never the plaintext password. The hash is generated offline before deploy.

2. **API route protection**: All mutating routes (`POST`, `PUT`) call `getServerSession(authOptions)` at the handler entry point and return `401` immediately if no valid session exists.

3. **Input validation**: All API route handlers validate request bodies with zod before any Prisma call. Client-side validation (react-hook-form + zod) is UX-only — never trusted by the server.

4. **Cloudinary preset**: The unsigned upload preset is scoped to image resource types only in the Cloudinary dashboard. No API key or secret is exposed to the client.

5. **`NEXTAUTH_SECRET`**: Must be a cryptographically random 32-byte base64 string. Used to sign and verify JWT session tokens.

6. **CSRF**: NextAuth.js handles CSRF protection for the credentials callback by default.

7. **Security headers**: Added in `next.config.ts` via `async headers()`:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy`: allows `self`, `unsafe-eval`/`unsafe-inline` for Next.js, `upload-widget.cloudinary.com` for script, `res.cloudinary.com` for images

8. **Soft delete**: Products and price lists are never hard-deleted; `active = false` is the only removal mechanism, preserving data integrity.

---

## 13. Internationalization (i18n)

### Approach

- **Library**: `next-intl` — supports both Server Components (`getTranslations()`) and Client Components (`useTranslations()`)
- **Locale strategy**: static per deployment — no URL-based routing, no runtime switcher in v1
- **Active locale**: read from `NEXT_PUBLIC_LOCALE` env var at request time

### Configuration

```typescript
// i18n.ts (project root)
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = (process.env.NEXT_PUBLIC_LOCALE ?? 'en') as 'en' | 'pt'
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

`next.config.ts` wraps the config with `createNextIntlPlugin('./i18n.ts')`.

The root layout provides `NextIntlClientProvider` with the pre-loaded messages so Client Components can access translations without an extra network request.

### Translation Files

```
messages/
├── en.json    # English (default)
└── pt.json    # Brazilian Portuguese
```

Every key present in `en.json` **must** have a corresponding key in `pt.json`. Missing keys in `pt.json` cause `next-intl` to fall back to the key name (not the English string) — enforce parity in PR review.

### Usage Pattern

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('store')
return <h1>{t('vitrine.title')}</h1>

// Client Component
'use client'
import { useTranslations } from 'next-intl'
function SortControl() {
  const t = useTranslations('store')
  return <select><option value="PROMO_FIRST">{t('sort.promoFirst')}</option></select>
}
```

**Rule**: No user-facing string literal may appear in JSX or component logic. All text goes through `t()`.

---

## 14. Testing Strategy

### Framework

| Tool | Purpose |
|------|---------|
| Jest (with `next/jest` preset) | Test runner + assertions |
| React Testing Library | Component rendering + user interaction |
| `@testing-library/jest-dom` | Extended DOM matchers |
| `@testing-library/user-event` | Realistic browser event simulation |

### TDD Approach

**Required for all implementation tasks**:
1. Write a failing test that describes the expected behavior (Given/When/Then from spec scenarios)
2. Write the minimum implementation to make the test pass
3. Refactor — keep tests green

Tests are never written after the fact. Each phase PR must demonstrate tests were written before or alongside the implementation code (commit history is evidence).

### Coverage Requirements

- **Minimum**: 60% across statements, branches, functions, and lines — enforced via Jest `coverageThreshold`
- **Target for `lib/`**: 80%+ (pure functions, deterministic — easy to test thoroughly)
- **Excluded from coverage**: `app/layout.tsx`, `app/globals.css`, generated files, `node_modules`

```typescript
// jest.config.ts (excerpt)
coverageThreshold: {
  global: { statements: 60, branches: 60, functions: 60, lines: 60 },
},
collectCoverageFrom: [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'store/**/*.{ts,tsx}',
  '!**/*.d.ts',
  '!app/layout.tsx',
],
```

### Test Organization

```
__tests__/
├── lib/
│   ├── pricing.test.ts       # resolvePrice() — unit, all edge cases
│   └── whatsapp.test.ts      # buildWhatsAppUrl() — unit
├── store/
│   └── cart.test.ts          # Zustand store actions
├── components/store/
│   ├── ProductCard.test.tsx
│   ├── CategoryFilter.test.tsx
│   └── SortControl.test.tsx
├── components/admin/
│   ├── ProductForm.test.tsx
│   └── PriceListForm.test.tsx
└── api/
    ├── products.test.ts      # API route handler tests
    └── price-lists.test.ts
```

### Lint Gate

`npm run lint` (ESLint with Next.js recommended rules) must pass with **0 errors** before any commit. Run `npm run lint` as part of the pre-commit check. Warnings are permitted but must not block CI.
