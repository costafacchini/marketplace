# Next.js Conventions

**Last Updated**: 2026-03-29
**Context**: When working with Next.js routing, data fetching, or server components

## App Router (Next.js 13+)
- `app/` directory with file-based routing
- `page.tsx` = route, `layout.tsx` = shared layout, `loading.tsx` = suspense fallback
- `error.tsx` = error boundary, `not-found.tsx` = 404
- Route groups `(group)` for layout organization without URL impact
- Parallel routes `@slot` for complex layouts

## Server vs Client Components
- Default: Server Components (no `"use client"` directive)
- Add `"use client"` only when you need: useState, useEffect, event handlers, browser APIs
- Keep client components as leaves — push `"use client"` boundary as deep as possible
- Server Components can import Client Components, not vice versa
- Pass server data to client components as serializable props

## Data Fetching
- Server Components: `async` component with direct `fetch()` or DB calls
- Client Components: TanStack Query or SWR for client-side fetching
- Route Handlers: `app/api/route.ts` for API endpoints
- Server Actions: `"use server"` functions for form submissions and mutations
- Always use `revalidatePath()` / `revalidateTag()` for cache invalidation

## Performance
- Use `next/image` for images (automatic optimization)
- Use `next/link` for navigation (prefetching)
- Use `next/font` for fonts (no layout shift)
- Dynamic imports with `next/dynamic` for code splitting
- Streaming with `loading.tsx` and `Suspense` boundaries

## Common Pitfalls
- Don't use `useEffect` for data fetching in Server Components — just `await` directly
- Route Handlers don't have access to request context in static generation
- Middleware runs on the Edge Runtime — no Node.js APIs
- `cookies()` / `headers()` make a route dynamic — can't be statically generated
