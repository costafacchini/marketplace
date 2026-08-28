# Task: Software Design Document

**Plan**: small-business-seller
**Phase**: 0
**Task ID (phase-local)**: task-01
**Task Path**: phase-0/task-01-sdd
**Spec References**: All stories (P1 + P2), all FR-XXX, all SC-XXX — this document precedes and informs all implementation
**Depends On**: None
**JIRA**: N/A

## Objective

Author `docs/sdd.md` — a comprehensive Software Design Document covering system architecture, data model, component hierarchy, API contracts, authentication design, Zustand state shape, Cloudinary integration, WhatsApp checkout flow, deployment topology, and environment variables.

## Context

This is a greenfield Next.js 14 project. No existing codebase to reference. The source of truth is `spec.md` at the repository root and the plan spec at `plans/small-business-seller/spec.md`. The SDD output (`docs/sdd.md`) becomes the authoritative reference for all subsequent implementation tasks — each task in phases 1–5 will link back to it.

Architecture decisions recorded in this SDD must be consistent with the technical decisions already stated in `spec.md`:
- Next.js 14 App Router (not Pages Router)
- Prisma ORM with PostgreSQL on Railway
- NextAuth.js Credentials (single admin, no OAuth)
- Zustand for client cart state
- Cloudinary Upload Widget (no server-side upload proxy)
- Vercel deployment

## Before You Start

- [ ] Switch to base branch and pull: `git switch main && git pull --rebase origin main`
- [ ] Read `spec.md` (root) in full
- [ ] Read `plans/small-business-seller/spec.md` in full
- [ ] Mark this task `in-progress` in `status.md` before proceeding

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `docs/sdd.md` | create | Primary deliverable — Software Design Document |
| `docs/kb/architecture/project-overview.md` | modify | Update with link to sdd.md and stack summary |

### Do NOT Modify

- Any source code files — this task is documentation only
- `plans/small-business-seller/spec.md` — spec is finalized

## Implementation Steps

### Step 1: Create docs/sdd.md

Write the SDD with the following sections:

#### 1. Overview
- Project purpose (1 paragraph)
- Key stakeholders (customer / seller)
- V1 scope summary and explicit out-of-scope items

#### 2. System Architecture
- Diagram description: Next.js on Vercel → API Routes → Prisma → PostgreSQL on Railway; Cloudinary Widget (browser direct upload); WhatsApp (external link)
- Request flow for: (a) customer browse, (b) admin product create, (c) WhatsApp checkout
- Route group strategy: `(store)` (public, no auth) vs `(admin)` (protected) vs `api/` (REST)

#### 3. Data Model
- Full Prisma schema (verbatim from spec.md, with annotations)
- Field-level notes: `price` as `Decimal(10,2)`, `images` as `String[]` (Cloudinary URLs), `sizes` as `String[]`, `active` as soft-delete flag
- No order table — orders travel via WhatsApp

#### 4. API Contracts
Document each endpoint:
```
GET    /api/products          → 200 { products: Product[] }   (query: ?active=true&category=CLOTHES)
POST   /api/products          → 201 { product: Product }       (admin only)
GET    /api/products/[id]     → 200 { product: Product } | 404
PUT    /api/products/[id]     → 200 { product: Product }       (admin only)
GET    /api/auth/session      → NextAuth session response
POST   /api/auth/callback/credentials → NextAuth login
```
Include request body shape and validation rules (zod) for POST/PUT.

#### 5. Authentication Design
- NextAuth.js Credentials provider
- `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (bcrypt) in env
- `middleware.ts` matcher: `['/admin/:path*']`
- Session strategy: JWT (stateless, no DB session table needed)
- Session `maxAge`: 8 hours
- Login page route: `app/(admin)/login/page.tsx`
- Why `bcryptjs` over `bcrypt`: pure JS avoids Vercel native module issues

#### 6. State Management (Zustand)
Document the cart store shape:
```typescript
interface CartItem {
  productId: string
  name: string
  size: string
  price: number   // stored as JS number, formatted on render
  quantity: number
  image: string   // first image URL
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void  // increments if exists
  removeItem: (productId: string, size: string) => void
  updateQty: (productId: string, size: string, qty: number) => void
  clear: () => void
  total: () => number
}
```
- Persistence: `zustand/middleware` `persist` with `localStorage`
- Key: `small-business-seller-cart`

#### 7. Cloudinary Integration
- Widget load strategy: CDN `<script>` tag in layout or dynamic import
- Upload preset: unsigned preset configured in Cloudinary dashboard
- Env vars: `CLOUDINARY_CLOUD_NAME` (public, exposed to client via `NEXT_PUBLIC_` prefix)
- Result handling: `onSuccess` callback pushes URL to form field array
- Note: `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are NOT needed for widget-only upload (unsigned preset)

#### 8. WhatsApp Checkout Flow
- Trigger: "Enviar pelo WhatsApp" button on confirmation screen
- Message builder (`lib/whatsapp.ts`):
  ```
  Olá! Gostaria de encomendar:\n\n
  - {name} Tam. {size} × {qty} — R$ {price}\n
  ...\n\n
  Total estimado: R$ {total}
  ```
- URL: `` `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` ``
- `WHATSAPP_NUMBER` exposed as `NEXT_PUBLIC_WHATSAPP_NUMBER`
- Opens in new tab (`target="_blank"`)

#### 9. Component Hierarchy
```
app/
  layout.tsx                    ← Root layout (SessionProvider, fonts)
  (store)/
    layout.tsx                  ← Store layout (Navbar with cart icon)
    page.tsx                    ← Vitrine (ProductGrid + CategoryFilter)
    products/[id]/page.tsx      ← ProductDetail (ImageGallery + SizePicker + AddToCartButton)
    cart/page.tsx               ← CartPage (CartItemList + OrderSummary + ConfirmModal)
  (admin)/
    layout.tsx                  ← Admin layout (admin navbar)
    login/page.tsx              ← LoginForm
    admin/
      page.tsx                  ← AdminProductTable
      products/new/page.tsx     ← ProductForm (create mode)
      products/[id]/edit/page.tsx ← ProductForm (edit mode)

components/
  ui/                           ← shadcn/ui primitives (Button, Card, Badge, etc.)
  store/
    ProductCard.tsx
    ProductGrid.tsx
    CategoryFilter.tsx
    ImageGallery.tsx
    SizePicker.tsx
    CartItemRow.tsx
    ConfirmModal.tsx
  admin/
    ProductForm.tsx
    CloudinaryWidget.tsx
    ProductTable.tsx
    ActiveToggle.tsx

store/
  cart.ts                       ← Zustand store

lib/
  prisma.ts                     ← Prisma client singleton
  whatsapp.ts                   ← Message formatter + URL builder
  auth.ts                       ← NextAuth config (authOptions)
  validations/
    product.ts                  ← Zod schemas for product create/update
```

#### 10. Deployment Architecture
- Frontend: Vercel (auto-deploy from `main`)
- Database: Railway PostgreSQL (free tier, 1 GB)
- Images: Cloudinary (free tier, 25 GB)
- Environment variables: all listed in `.env.example`
- `DATABASE_URL` must include `?connection_limit=1&pool_timeout=10` for serverless

#### 11. Environment Variables
Document every variable from spec.md with:
- Name
- Required / Optional
- Scope (server-only vs `NEXT_PUBLIC_`)
- How to generate/obtain
- Example value

#### 12. Security Considerations
- Admin password stored as bcrypt hash, never plaintext
- API mutation routes check `getServerSession(authOptions)` before executing
- Cloudinary unsigned preset is scoped to allowed file types (images only)
- `NEXTAUTH_SECRET` must be a cryptographically random 32-byte string
- Input validation via zod on all API routes

### Step 2: Update KB Architecture Overview

Update `docs/kb/architecture/project-overview.md` to:
- Reference the stack (Next.js 14, Prisma, Railway, Cloudinary, Zustand, Vercel)
- Link to `docs/sdd.md` as the primary architecture reference

### Step 3: Run check-kb-index

After updating KB files, run the `check-kb-index` skill to update `docs/kb/README.md`.

## Testing

**Spec scenarios covered**: N/A — this task produces documentation, not executable code.

**Additional verification**:
- [ ] All 12 SDD sections are present and complete
- [ ] API contracts cover all routes from `spec.md` route structure
- [ ] Zustand store shape matches the cart scenarios in Story 3
- [ ] Environment variable table is complete (all vars from spec.md are documented)
- [ ] SDD links back to `spec.md` as the source of requirements

## Documentation / KB Updates

- [ ] `docs/sdd.md` — primary deliverable (created by this task)
- [ ] `docs/kb/architecture/project-overview.md` — update with stack and link to sdd.md
- [ ] Run `check-kb-index` after KB changes

## Completion Criteria

- [ ] `docs/sdd.md` exists and all 12 sections are complete
- [ ] All architectural decisions from `spec.md` are represented in the SDD
- [ ] `docs/kb/architecture/project-overview.md` links to `docs/sdd.md`
- [ ] `check-kb-index` has been run and `docs/kb/README.md` is updated
- [ ] Changes committed to `plan/small-business-seller/phase-0/task-01-sdd` branch
- [ ] Status updated in `status.md`
