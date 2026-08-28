# Marketplace Filha

A simple marketplace for selling clothes, lingerie, and workout wear. Customers browse products, build a cart, and send the order via WhatsApp for the seller to close the sale manually.

---

## Features

### Store (public)
- Product grid with category filter (Clothes, Lingerie, Workout)
- Sort options: promotions first, lowest price, A–Z
- **"X% OFF"** badge on promotional product cards
- Product detail page with photo gallery and size selector
- Client-side cart (no login required) with quantity controls
- WhatsApp checkout with a pre-formatted order message

### Price lists (promotions)
- Percentage discount with a validity window (start date + expiry date)
- Scope by category and/or individual products
- Per-product discount override within the same list
- Promotional price displayed throughout the entire flow — grid, detail, cart, and WhatsApp message

### Admin panel (seller)
- Email + password authentication (no OAuth)
- Product CRUD with direct-to-Cloudinary photo upload
- Activate/deactivate products (no hard delete)
- Price list CRUD with category and product scope selection

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL (Railway) |
| ORM | Prisma |
| Authentication | NextAuth.js (Credentials) |
| Images | Cloudinary Upload Widget |
| Cart state | Zustand (client-side, persisted in localStorage) |
| UI | shadcn/ui + Tailwind CSS |
| Validation | Zod + react-hook-form |
| Frontend deploy | Vercel |
| Database deploy | Railway |

---

## Data Model

```prisma
model Product {
  id             String          @id @default(cuid())
  name           String
  description    String?
  price          Decimal         @db.Decimal(10, 2)
  category       Category
  sizes          String[]
  images         String[]        // Cloudinary URLs
  active         Boolean         @default(true)
  priceListItems PriceListItem[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model PriceList {
  id          String          @id @default(cuid())
  name        String
  discountPct Decimal         @db.Decimal(5, 2)   // 0.00–100.00
  startsAt    DateTime
  expiresAt   DateTime
  active      Boolean         @default(true)
  categories  Category[]
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
  discountPct Decimal?  @db.Decimal(5, 2)  // per-product override

  @@unique([priceListId, productId])
}

enum Category {
  CLOTHES   // Roupas
  LINGERIE  // Roupas Íntimas
  WORKOUT   // Academia
}
```

---

## Customer Flow

1. Opens the store → filters by category and sorts as preferred
2. Sees discount badge on promotional products
3. Opens a product → photo gallery, price (with discount if applicable), available sizes
4. Adds to cart with chosen size
5. Reviews cart → adjusts quantities or removes items
6. Clicks **Confirm Order** → pre-redirect notice screen
7. **Send via WhatsApp** → opens `wa.me` with a pre-formatted message

```
Olá! Gostaria de encomendar:

- Blusa Fitness Tam. P × 2 — R$ 71,92
- Conjunto Íntimo Tam. M × 1 — R$ 120,00

Total estimado: R$ 263,84
```

---

## Seller Flow (admin)

1. Navigates to `/login` → authenticates with email and password
2. Manages products: create, edit, activate/deactivate, upload photos
3. Manages price lists: sets discount %, validity period, and scope
4. Closes each sale manually via WhatsApp

---

## Price Resolution Logic

For each product, the system checks all active price lists (`active = true` and within the validity window), ordered most recent first (`createdAt DESC`). The first list that covers the product is applied:

1. Product has an individual entry in the list → uses the item's `discountPct` (or the list's if no override)
2. Product's category is in the list → uses the list's `discountPct`

If multiple active lists cover the same product, the **most recently created** list wins.

---

## Route Structure

```
app/
├── (store)/                              ← public store (no auth)
│   ├── page.tsx                          ← product grid with filter + sort
│   ├── products/[id]/page.tsx            ← product detail
│   └── cart/page.tsx                     ← cart + WhatsApp checkout
│
├── (admin)/                              ← seller panel (auth required)
│   ├── login/page.tsx
│   └── admin/
│       ├── page.tsx                      ← product listing
│       ├── products/new/page.tsx
│       ├── products/[id]/edit/page.tsx
│       ├── price-lists/page.tsx          ← price list listing
│       ├── price-lists/new/page.tsx
│       └── price-lists/[id]/edit/page.tsx
│
└── api/
    ├── products/route.ts
    ├── products/[id]/route.ts
    ├── price-lists/route.ts
    ├── price-lists/[id]/route.ts
    └── auth/[...nextauth]/route.ts
```

---

## Environment Variables

```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=           # https://your-domain.vercel.app

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=   # unsigned upload preset

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=    # bcryptjs.hashSync('password', 12)

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=   # format: 5511999999999
```

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in the variables
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

---

## Out of Scope (v1)

- Online payment
- Customer registration
- Order history
- Per-unit inventory control
- Multiple admin users
- Push / email notifications
