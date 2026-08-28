# Task: NextAuth Authentication + Middleware

**Plan**: small-business-seller
**Phase**: 2
**Task ID (phase-local)**: task-03
**Task Path**: phase-2/task-03-auth
**Spec References**: Story 4 (P2) — SC-001·4·5, FR-005, FR-006, FR-012
**Depends On**: phase-1/task-02-scaffold
**JIRA**: N/A

## Objective

Implement NextAuth.js Credentials authentication: configure the auth provider, create the login page, add the `middleware.ts` route guard for all `/admin/**` routes, and expose a sign-out action.

## Context

Reference `docs/sdd.md` section 5 (Authentication Design) before starting.

Key decisions from the SDD:
- NextAuth.js Credentials strategy; single admin user
- Credentials validated against `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env vars using `bcryptjs`
- Session strategy: **JWT** (no DB session table)
- `middleware.ts` matcher: `['/admin/:path*']`
- Session `maxAge`: 8 hours
- Login route: `app/(admin)/login/page.tsx`
- Use **`bcryptjs`** (pure JS) — avoids Vercel native module issues

This task does NOT create any admin product pages (those are in task-08 and task-09). It only sets up the auth layer and the login/logout UI.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-1/task-02-scaffold` status is `complete`
- [ ] Read `docs/sdd.md` section 5
- [ ] Verify `next-auth` and `bcryptjs` are in `package.json` (installed by task-02)
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `lib/auth.ts` | create | NextAuth `authOptions` config |
| `app/api/auth/[...nextauth]/route.ts` | create | NextAuth route handler |
| `app/(admin)/login/page.tsx` | create | Login form page |
| `app/(admin)/layout.tsx` | create | Admin layout with session provider wrapper |
| `middleware.ts` | create | Route guard for /admin |
| `components/admin/LoginForm.tsx` | create | Client component with form + error handling |

### Do NOT Modify

- `app/api/products/` — owned by task-04-api-products
- `prisma/schema.prisma` — owned by task-02-scaffold
- `lib/prisma.ts` — owned by task-02-scaffold

## Implementation Steps

### Step 1: Create lib/auth.ts

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        if (credentials.email !== process.env.ADMIN_EMAIL) return null
        const valid = await compare(
          credentials.password,
          process.env.ADMIN_PASSWORD_HASH!
        )
        if (!valid) return null
        return { id: '1', email: credentials.email, name: 'Admin' }
      },
    }),
  ],
}
```

### Step 2: Create app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Step 3: Create middleware.ts (root level)

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/admin/:path*'],
}
```

### Step 4: Create app/(admin)/layout.tsx

Wrap admin routes with a `SessionProvider` (must be a Client Component wrapper):
```typescript
// app/(admin)/layout.tsx — Server Component
import { SessionProvider } from '@/components/admin/SessionProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Create `components/admin/SessionProvider.tsx` as the client boundary:
```typescript
'use client'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

### Step 5: Create app/(admin)/login/page.tsx

Server component that renders `<LoginForm />`. Do not use `useSearchParams` directly — defer that to the client component.

### Step 6: Create components/admin/LoginForm.tsx

Client component using react-hook-form + zod:
- Fields: email, password
- On submit: call `signIn('credentials', { email, password, callbackUrl: '/admin' })`
- On error (NextAuth returns error query param): display "E-mail ou senha inválidos"
- Show loading state on submit button

### Step 7: Add sign-out button to admin layout

Add a "Sair" button in the admin layout's header that calls `signOut({ callbackUrl: '/login' })`.

## Testing

Test stubs to be created at `__tests__/auth/`:

**Spec scenarios covered**:
- [ ] Story 4 / Scenario 1: **Given** admin navigates to `/login`, **When** valid credentials submitted, **Then** redirected to `/admin` — `__tests__/auth/login.test.tsx` (integration)
- [ ] Story 4 / Scenario 2: **Given** admin on `/login`, **When** invalid credentials submitted, **Then** error message shown — `__tests__/auth/login.test.tsx`
- [ ] Story 4 / Scenario 3: **Given** unauthenticated user, **When** navigating to `/admin`, **Then** redirected to `/login` — `__tests__/auth/middleware.test.ts`
- [ ] Story 4 / Scenario 5: **Given** admin logged in, **When** "Sair" clicked, **Then** session cleared and redirected to `/login` — `__tests__/auth/logout.test.tsx`

**Additional verification**:
- [ ] `middleware.ts` does not intercept `(store)` routes
- [ ] `ADMIN_EMAIL` mismatch returns null from `authorize` (unit test in `__tests__/auth/authOptions.test.ts`)
- [ ] `bcryptjs.compare` mismatch returns null from `authorize`
- [ ] `npm run build` succeeds

## Documentation / KB Updates

- [ ] Run `document-solution` after this task if the NextAuth + App Router + JWT pattern is non-obvious
- [ ] No new KB doc required if `docs/sdd.md` section 5 is complete

## Completion Criteria

- [ ] Story 4 Scenarios 1–3 and 5 pass
- [ ] Valid login redirects to `/admin`
- [ ] Invalid login stays on `/login` with error message
- [ ] Unauthenticated `/admin` access redirects to `/login`
- [ ] Sign-out clears session and redirects to `/login`
- [ ] `middleware.ts` does not block `(store)` routes
- [ ] Changes committed to `plan/small-business-seller/phase-2/task-03-auth` branch
- [ ] Status updated in `status.md`
