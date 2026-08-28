# Feature Specification: Marketplace Filha

**Plan**: marketplace-filha
**Created**: 2026-08-27
**Status**: Final
**Input**: Next.js 14 clothing marketplace with Prisma/PostgreSQL, Cloudinary, Zustand cart, WhatsApp checkout — based on spec.md

---

## User Stories *(mandatory)*

### Story 1 — Customer Browses and Filters Products (P1)

A customer visits the store, sees all active products, and can filter by category (Roupas, Íntimas, Academia) to find what they want.

**Why this priority**: This is the entry point of the entire purchase flow. Without it, nothing else matters.

**Independent Test**: Open the homepage — products appear in a grid; clicking category tabs correctly filters results.

**Acceptance Scenarios**:

1. **Given** the customer opens the store homepage, **When** the page loads, **Then** all active products are displayed in a responsive grid with name, price and main photo.
2. **Given** the customer is on the homepage, **When** they click the "Roupas" category tab, **Then** only products with `category = CLOTHES` and `active = true` are shown.
3. **Given** the customer is on the homepage, **When** they click "Íntimas", **Then** only `LINGERIE` products appear.
4. **Given** the customer is on the homepage, **When** they click "Academia", **Then** only `WORKOUT` products appear.
5. **Given** a category has no active products, **When** the customer selects that filter, **Then** an empty-state message is displayed and no product cards are rendered.

---

### Story 2 — Customer Views Product Detail and Adds to Cart (P1)

A customer clicks a product card, views full details (photos, description, price, available sizes), selects a size, and adds the product to the cart.

**Why this priority**: Core purchase action — directly enables the checkout flow.

**Independent Test**: Navigate to `/products/[id]`, select a size, click "Adicionar ao Carrinho" — item appears in the cart badge/icon.

**Acceptance Scenarios**:

1. **Given** the customer is on the vitrine, **When** they click a product card, **Then** the product detail page loads with all images, full description, price, and all available sizes.
2. **Given** the customer is on the product detail page, **When** they select a size and click "Adicionar ao Carrinho", **Then** the item (with chosen size) is added to the Zustand cart store.
3. **Given** the customer has not selected a size, **When** they click "Adicionar ao Carrinho", **Then** an inline validation message prompts them to select a size before proceeding.
4. **Given** a product has multiple images, **When** the customer views the detail page, **Then** they can navigate through all images via a gallery/carousel.
5. **Given** the customer adds the same product+size combination twice, **When** they view the cart, **Then** the item quantity is incremented rather than duplicated.

---

### Story 3 — Customer Checks Out via WhatsApp (P1)

The customer reviews their cart, confirms the order, and is redirected to WhatsApp with a pre-formatted message for the seller to close the sale.

**Why this priority**: The entire sales funnel culminates here — it is the direct revenue mechanism.

**Independent Test**: Add items to cart, open cart page, click "Confirmar Pedido" — WhatsApp opens (or `wa.me` URL is correct on desktop).

**Acceptance Scenarios**:

1. **Given** the cart has items, **When** the customer views `/cart`, **Then** all items are listed with name, selected size, quantity, unit price, and subtotal; a grand total is displayed at the bottom.
2. **Given** the customer is on the cart page, **When** they click "Confirmar Pedido", **Then** a confirmation screen appears with the message: *"Você será redirecionada ao WhatsApp para finalizar a compra diretamente com a vendedora."*
3. **Given** the confirmation screen is shown, **When** the customer clicks "Enviar pelo WhatsApp", **Then** the browser opens `wa.me/{WHATSAPP_NUMBER}?text=...` with a correctly formatted order message.
4. **Given** the cart is empty, **When** the customer visits `/cart`, **Then** an empty-cart state is shown with a "Ver Produtos" link back to the vitrine.
5. **Given** the cart has items, **When** the customer adjusts an item quantity or removes an item, **Then** the subtotals and grand total update immediately.

**WhatsApp message format**:
```
Olá! Gostaria de encomendar:

- {Nome} Tam. {Tamanho} × {Qty} — R$ {preco}
...

Total estimado: R$ {total}
```

---

### Story 4 — Admin Authenticates and Views Product List (P2)

The seller navigates to `/login`, enters her credentials, and is directed to the admin panel where she sees all products (active and inactive) with status indicators.

**Why this priority**: Gate to all admin functionality; must be secure and reliable.

**Independent Test**: POST to `/api/auth` with valid credentials returns session; accessing `/admin` without auth redirects to `/login`.

**Acceptance Scenarios**:

1. **Given** the admin navigates to `/login`, **When** she enters valid email and password, **Then** she is redirected to `/admin`.
2. **Given** the admin is on `/login`, **When** she enters invalid credentials, **Then** an error message is displayed and she remains on `/login`.
3. **Given** an unauthenticated user, **When** they navigate to any `/admin/**` route, **Then** they are redirected to `/login`.
4. **Given** the admin is on `/admin`, **When** the page loads, **Then** all products (active and inactive) are listed in a table with name, category, price, and an active/inactive badge.
5. **Given** the admin is logged in, **When** she clicks "Sair", **Then** the session is destroyed and she is redirected to `/login`.

---

### Story 5 — Admin Creates and Edits Products (P2)

The seller creates new products (with name, description, price, category, sizes, and Cloudinary photos) and can edit or deactivate existing ones.

**Why this priority**: Without product management, the catalog can't grow or be maintained.

**Independent Test**: Fill the new product form with all required fields, upload at least one photo via Cloudinary Widget, submit — product appears in the admin list.

**Acceptance Scenarios**:

1. **Given** the admin is on `/admin/products/new`, **When** she fills all required fields (name, price, category, ≥1 size, ≥1 photo) and submits, **Then** a new product is created via `POST /api/products` and she is redirected to `/admin`.
2. **Given** the admin submits the form with missing required fields, **When** the form validates, **Then** field-level error messages are shown and the form is not submitted.
3. **Given** the admin is on `/admin/products/[id]/edit`, **When** she updates fields and saves, **Then** the changes are persisted via `PUT /api/products/[id]`.
4. **Given** the admin is on the edit page, **When** she toggles the "Ativo" switch and saves, **Then** `product.active` is updated and the vitrine hides/shows the product accordingly.
5. **Given** the admin uses the Cloudinary Upload Widget, **When** she selects and uploads photos, **Then** the images upload directly to Cloudinary and the returned URLs are stored in `product.images[]`.

---

### Edge Cases

- Adding the same product+size twice increments quantity (Story 2 scenario 5).
- A product deactivated while in a customer's cart still sends via WhatsApp — the seller handles stock verification manually.
- Cloudinary upload failure must block form submission and show an error; at least 1 image is required.
- Admin price changes after a customer adds to cart will reflect only on page refresh — the cart is client-side state.
- WhatsApp deep link behavior on mobile: `wa.me` opens the app if installed; browsers fall back to web.whatsapp.com.

---

### Story 6 — Customer Sees Promotional Prices (P1)

When a price list is active and covers a product (by category or individually), the customer sees the discounted price alongside the original struck-through price. The promotional price is used everywhere: vitrine card, product detail, cart totals, and the WhatsApp order message.

**Why this priority**: Promotional pricing is a key sales mechanic for the seller; it must be visible throughout the entire purchase flow.

**Independent Test**: Create an active price list covering one category → products in that category show struck-through original price and highlighted promo price on the vitrine.

**Acceptance Scenarios**:

1. **Given** an active price list covers the CLOTHES category with 20% off, **When** the customer views the vitrine, **Then** CLOTHES products display the discounted price and the original price struck through.
2. **Given** a product has an individual entry in a price list AND its category also appears in the same list, **When** the price is computed, **Then** the product-level discount is applied (product-level overrides category-level).
3. **Given** two active price lists both cover the same product, **When** the price is computed, **Then** the discount from the most recently created list is applied.
4. **Given** a price list whose `expiresAt` is in the past, **When** the customer views an affected product, **Then** the original price is shown (no discount).
5. **Given** a price list whose `startsAt` is in the future, **When** the customer views an affected product, **Then** the original price is shown (promotion not yet active).
6. **Given** a product is covered by a price list, **When** the customer adds it to the cart, **Then** the discounted price is stored in the cart and used in totals and the WhatsApp message.

---

### Story 7 — Admin Manages Price Lists (P2)

The seller creates and manages price lists: each list has a name, a percentage discount, a date range (start + expiry), an active flag, and a scope (one or more categories and/or specific products).

**Why this priority**: Without admin tooling to manage price lists, the feature cannot be used.

**Independent Test**: Create a price list from the admin panel targeting one category with a % off and a future expiry → the list appears in the admin listing and the discount is visible in the store.

**Acceptance Scenarios**:

1. **Given** the admin is on `/admin/price-lists/new`, **When** she fills name, discount %, start date, expiry date, selects at least one category or product, and submits, **Then** the price list is created via `POST /api/price-lists` and appears in the listing.
2. **Given** the admin submits the form with `expiresAt` before `startsAt`, **When** form validates, **Then** a validation error is shown and the list is not created.
3. **Given** the admin is on a price list edit page, **When** she updates fields and saves, **Then** changes are persisted via `PUT /api/price-lists/[id]`.
4. **Given** the admin toggles a price list's active switch to off, **When** saved, **Then** the price list no longer affects any product prices in the store.
5. **Given** the admin lists price lists at `/admin/price-lists`, **When** the page loads, **Then** all price lists are shown with name, discount %, date range, active status, and covered scope.

---

## Functional Requirements *(mandatory)*

- **FR-001**: System MUST display only products where `active = true` on the store front (`(store)/` routes).
- **FR-002**: System MUST support filtering active products by `Category` enum (CLOTHES, LINGERIE, WORKOUT) on the vitrine without a full page reload.
- **FR-003**: System MUST persist cart state client-side using Zustand; no customer login required.
- **FR-004**: System MUST generate a correctly encoded `wa.me/{WHATSAPP_NUMBER}?text=...` URL from cart contents at checkout time.
- **FR-005**: System MUST authenticate admin using NextAuth.js Credentials strategy, validating against `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (bcrypt) environment variables.
- **FR-006**: System MUST protect all `/admin/**` routes via Next.js middleware, redirecting unauthenticated requests to `/login`.
- **FR-007**: System MUST integrate Cloudinary Upload Widget for direct browser-to-Cloudinary photo upload; resulting URLs are stored in `product.images[]`.
- **FR-008**: System MUST implement soft-delete via `product.active` flag; no `DELETE` endpoint removes records from the database.
- **FR-009**: System MUST store product prices as `Decimal(10,2)` in PostgreSQL via Prisma and format them as `R$ X,XX` in the UI.
- **FR-010**: System MUST display a pre-checkout confirmation screen before opening WhatsApp, informing the customer she will be redirected.
- **FR-011**: System MUST validate product form fields on both client (zod + react-hook-form) and server (zod in API route handler).
- **FR-012**: System MUST return `401 Unauthorized` from all `POST /api/products` and `PUT /api/products/[id]` calls when no valid session exists.
- **FR-013**: All store-front pages (`(store)/`) MUST be designed mobile-first and usable on screens ≥ 320px wide. Tap targets MUST be ≥ 44×44px. No horizontal scroll on any viewport.
- **FR-014**: System MUST resolve the effective price for each product at render time using all active price lists (`active = true` AND `startsAt <= now() <= expiresAt`).
- **FR-015**: When a product is covered both via its category AND via an individual `PriceListItem` entry in the same price list, the `PriceListItem` entry MUST take precedence; its `discountPct` override is used if set, otherwise the list's `discountPct`.
- **FR-016**: When multiple active price lists cover the same product, the most recently created (`createdAt DESC`) list's discount MUST be applied.
- **FR-017**: Price resolution logic MUST be centralized in `lib/pricing.ts` and reused across Server Components and API routes — never duplicated.
- **FR-018**: A `PriceList` MUST have: `name`, `discountPct` (Decimal 0–100), `startsAt` (DateTime), `expiresAt` (DateTime), `active` (Boolean), optional `categories` (Category[]), and optional `items` (PriceListItem[]).
- **FR-019**: `PriceListItem` MAY carry an individual `discountPct` override (Decimal 0–100, optional); if null, the parent list's `discountPct` is used.
- **FR-020**: Admin MUST be able to create, edit, and deactivate price lists. No hard-delete — use `active = false`.

---

## Success Criteria *(mandatory)*

- **SC-001**: A customer can complete the full flow — browse → product detail → add to cart → WhatsApp checkout — without creating an account.
- **SC-002**: Admin can create a product with photos in under 3 minutes using the Cloudinary Upload Widget.
- **SC-003**: Only active products appear on the vitrine; deactivating a product immediately removes it from the store on next page load.
- **SC-004**: The WhatsApp `text` parameter contains the correctly formatted order with each item's name, size, qty, price, and the total.
- **SC-005**: All `/admin/**` routes return a redirect to `/login` for unauthenticated requests (verified via middleware test).
- **SC-006**: Product form validates required fields client-side (zod) and rejects invalid POSTs server-side with descriptive error responses.
- **SC-007**: The full customer flow (vitrine → detail → cart → checkout) is verified on a 375px-wide viewport (iPhone SE baseline) with no layout breaks, no horizontal scroll, and all tap targets reachable.
- **SC-008**: A product covered by an active price list shows the discounted price prominently and the original price struck through, on both the vitrine card and the product detail page.
- **SC-009**: The WhatsApp order message uses the promotional price (not the original price) for any item covered by an active price list.

---

## Assumptions

- A single admin user (the seller); no multi-user, roles, or OAuth needed.
- Cart is ephemeral (localStorage via Zustand persist); orders are not stored in the database.
- The seller closes every sale manually via WhatsApp — no payment gateway in scope.
- Cloudinary free tier is sufficient for v1 image storage.
- Deployment targets: Vercel (frontend) + Railway (PostgreSQL); no Docker required for production.
- `ADMIN_PASSWORD_HASH` is a bcrypt hash generated offline before deploy; no admin registration flow.
- Mobile-first design but not a native app — responsive web only.
