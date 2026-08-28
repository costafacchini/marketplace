# Task: Project Scaffold + Prisma Schema

**Plan**: marketplace-filha
**Phase**: 1
**Task ID (phase-local)**: task-02
**Task Path**: phase-1/task-02-scaffold
**Spec References**: FR-009 (Decimal price), FR-022, FR-023, FR-025 (i18n setup), FR-026, FR-028, FR-029 (test + lint setup), all stories (foundational)
**Depends On**: phase-0/task-01-sdd
**JIRA**: N/A

## Objective

Initialize the Next.js 14 App Router project, install and configure all dependencies (Prisma, shadcn/ui, Tailwind, NextAuth, Zustand), define the Prisma schema with the `Product` model and `Category` enum, and run the initial database migration.

## Context

Reference `docs/sdd.md` sections 2 (Architecture), 3 (Data Model), 9 (Component Hierarchy), 10 (Deployment), and 11 (Environment Variables) before starting.

This task creates the skeleton all other tasks build on. It must:
- Use **Next.js 14 App Router** (not Pages Router)
- Use **TypeScript** throughout
- Configure **Tailwind CSS** and initialize **shadcn/ui**
- Install **Prisma** and define the schema from `spec.md`
- Create `.env.example` with all variables from the SDD
- NOT implement any features — only scaffold and schema

Database migration runs locally against a dev PostgreSQL instance. Production migration (`prisma migrate deploy`) is documented in task-10-deploy.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-0/task-01-sdd` status is `complete` — read `docs/sdd.md`
- [ ] Ensure Node.js ≥ 18 and `npm` are available locally
- [ ] Ensure a local PostgreSQL instance is running for dev migration
- [ ] Mark this task `in-progress` in `status.md` before proceeding

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `package.json` | create | All project dependencies |
| `next.config.ts` | create | Next.js config (image domains: res.cloudinary.com) |
| `tsconfig.json` | create | TypeScript config |
| `tailwind.config.ts` | create | Tailwind config with shadcn/ui preset |
| `postcss.config.mjs` | create | PostCSS config |
| `prisma/schema.prisma` | create | Product model + Category enum |
| `.env.example` | create | All env vars documented, no real values |
| `.env.local` | create | Dev env (gitignored) |
| `lib/prisma.ts` | create | Prisma client singleton |
| `app/layout.tsx` | create | Root layout |
| `app/globals.css` | create | Tailwind directives |
| `components/ui/` | create | shadcn/ui primitive installs (button, card, badge, input, label, tabs, dialog) |
| `CLAUDE.md` | modify | Add test/lint/dev commands to Key commands section |
| `jest.config.ts` | create | Jest config with next/jest preset and 60% coverage thresholds |
| `jest.setup.ts` | create | Jest global setup — imports @testing-library/jest-dom |
| `i18n.ts` | create | next-intl request config (reads `NEXT_PUBLIC_LOCALE`) |
| `messages/en.json` | create | English translation strings (scaffold keys only — all features add their keys) |
| `messages/pt.json` | create | Brazilian Portuguese translations (mirrors en.json) |

### Do NOT Modify

No sibling tasks in this phase.

## Implementation Steps

### Step 1: Initialize Next.js 14 Project

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

### Step 2: Install Dependencies

Look up current versions before installing:
```bash
npm show prisma version
npm show @prisma/client version
npm show next-auth version
npm show zustand version
npm show bcryptjs version
npm show @types/bcryptjs version
npm show zod version
npm show react-hook-form version
npm show @hookform/resolvers version
```

Then install:
```bash
npm show next-intl version
npm show jest version
npm show jest-environment-jsdom version
npm show @testing-library/react version
npm show @testing-library/jest-dom version
npm show @testing-library/user-event version
```

Then install:
```bash
npm install prisma @prisma/client next-auth zustand bcryptjs zod react-hook-form @hookform/resolvers next-intl
npm install -D @types/bcryptjs jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Step 3: Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

### Step 4: Write prisma/schema.prisma

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
  price          Decimal         @db.Decimal(10, 2)
  category       Category
  sizes          String[]
  images         String[]
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
  categories  Category[]      // empty = no category-level coverage
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
  discountPct Decimal?  @db.Decimal(5, 2)  // overrides PriceList.discountPct when set

  @@unique([priceListId, productId])
}

enum Category {
  CLOTHES
  LINGERIE
  WORKOUT
}
```

### Step 5: Initialize shadcn/ui

```bash
npx shadcn@latest init
```
Accept defaults (New York style, Zinc color, CSS variables).

Then install required components:
```bash
npx shadcn@latest add button card badge input label tabs dialog select switch
```

### Step 6: Create lib/prisma.ts (Singleton)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 7: Create .env.example

Document all variables from SDD section 11:
```env
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=1&pool_timeout=10"

# NextAuth
NEXTAUTH_SECRET=""        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""  # unsigned preset name

# Admin credentials
ADMIN_EMAIL=""
ADMIN_PASSWORD_HASH=""    # bcryptjs.hashSync('password', 12)

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=""  # format: 5511999999999
```

### Step 8: Configure next.config.ts

Enable Cloudinary image domain:
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}
```

### Step 9: Run Initial Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 10: Configure Jest + React Testing Library

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!app/layout.tsx',          // pure wiring, no logic
    '!app/globals.css',
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add test scripts to `package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Step 12: Set Up next-intl (i18n)

Create `i18n.ts` at the project root:
```typescript
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = (process.env.NEXT_PUBLIC_LOCALE ?? 'en') as 'en' | 'pt'
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

Create `messages/en.json` with scaffold-level keys (each feature task adds its own namespace):
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong.",
    "save": "Save",
    "cancel": "Cancel",
    "back": "Back"
  }
}
```

Create `messages/pt.json` mirroring every key in `en.json`:
```json
{
  "common": {
    "loading": "Carregando...",
    "error": "Algo deu errado.",
    "save": "Salvar",
    "cancel": "Cancelar",
    "back": "Voltar"
  }
}
```

Update `next.config.ts` to register the i18n plugin:
```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
}

export default withNextIntl(nextConfig)
```

Add `NEXT_PUBLIC_LOCALE` to `.env.example`:
```env
# Locale
NEXT_PUBLIC_LOCALE=en   # en (default) | pt
```

Wrap the root layout with `NextIntlClientProvider`:
```typescript
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <html lang={process.env.NEXT_PUBLIC_LOCALE ?? 'en'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Step 13: Update CLAUDE.md Key Commands

Add to the project CLAUDE.md:
```
# [npm run dev]          # Dev server (localhost:3000)
# [npm test]             # Run tests
# [npm run lint]         # ESLint
# [npx prisma studio]    # Browse database
# [npx prisma migrate dev]  # Run DB migrations
```

## Testing

**Spec scenarios covered**: N/A — this task is scaffold only; no user-facing scenarios yet.

**Additional verification**:
- [ ] `npm test` runs with 0 failures (no coverage yet — scaffold has no app code)
- [ ] `npm run test:coverage` runs without crashing and reports 0 uncovered lines (empty coverage is acceptable at scaffold stage)
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run dev` starts without errors on port 3000 with `NEXT_PUBLIC_LOCALE=en`
- [ ] `NEXT_PUBLIC_LOCALE=pt npm run dev` starts without errors and `getTranslations()` resolves Portuguese strings
- [ ] `messages/en.json` and `messages/pt.json` have identical key sets
- [ ] `npx prisma migrate dev` completes successfully (migration file created)
- [ ] `npx prisma generate` completes without errors
- [ ] `npm run build` completes without TypeScript errors
- [ ] `npm run lint` passes with no errors
- [ ] All shadcn/ui components installed are importable without errors

## Documentation / KB Updates

- [ ] Update `CLAUDE.md` with dev/test/lint commands
- [ ] No new KB doc needed — SDD (task-01) already covers the stack
- [ ] If any dependency version decision is non-obvious, note it in `docs/kb/architecture/project-overview.md`

## Completion Criteria

- [ ] `jest.config.ts` with coverageThreshold at 60% is in place
- [ ] `npm test` and `npm run test:coverage` scripts work
- [ ] `i18n.ts` configured, `NextIntlClientProvider` in root layout
- [ ] `messages/en.json` and `messages/pt.json` exist with identical key sets
- [ ] `prisma/schema.prisma` matches spec exactly
- [ ] `npx prisma migrate dev --name init` ran successfully
- [ ] `.env.example` documents all required variables
- [ ] `npm run dev` launches Next.js 14 dev server without errors
- [ ] shadcn/ui primitives are installed and importable
- [ ] Changes committed to `plan/marketplace-filha/phase-1/task-02-scaffold` branch
- [ ] Status updated in `status.md`
