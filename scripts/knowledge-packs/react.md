# React Conventions

**Last Updated**: 2026-08-26
**Context**: When building React components or features

## Components
- Functional components only — no class components
- One component per file, filename matches component name (PascalCase)
- Colocate tests, styles, and types with the component
- Props interface named `{ComponentName}Props`
- Use `children` prop for composition over configuration

## React 19 / React Compiler

- **React Compiler** (stable in React 19) auto-memoizes components and hooks. If the project uses React Compiler (`babel-plugin-react-compiler` / Next.js 15+), do NOT add `useMemo`/`useCallback` manually — the compiler does it and manual memoization fights it.
- **Actions API**: use `useActionState` for async operations (replaces manual loading/error/success state patterns from React 18). Use `useFormStatus` inside form components for pending state.
- **`useOptimistic`**: for optimistic UI — apply before the async operation, auto-rolls back on error.
- **`use()` hook**: can be called conditionally (unlike all other hooks). Accepts a Promise or Context value.
- Check `react-compiler` in `package.json` or `next.config` to determine if compiler is active.

## Hooks
- Call hooks at the top level only — never inside conditions, loops, or callbacks (exception: `use()` hook is conditional-safe)
- Custom hooks: prefix with `use`, extract when logic is reused in 2+ components
- `useEffect` dependencies: include ALL referenced values; use ESLint rule `react-hooks/exhaustive-deps`
- `useMemo`/`useCallback`: only when there's a measured performance problem AND the project is not using React Compiler

## State
- Local state: `useState` for simple, `useReducer` for complex
- Async/form state: prefer `useActionState` (React 19) over manual loading/error/success state
- Server state: React Query / TanStack Query (not manual useEffect+fetch)
- Global state: context for low-frequency (theme, auth), external store (Zustand) for high-frequency
- Never store derived data in state — compute it during render

## Patterns
- Early return in rendering for loading/error states
- Prefer controlled components for forms
- Use `key` prop on lists — never use array index as key if items can reorder
- Lift state to the lowest common ancestor, not to the top

## Common Pitfalls
- Stale closures in useEffect/callbacks — check dependency arrays
- State updates are async — don't read state immediately after setState
- Avoid setting state in useEffect that triggers another useEffect (infinite loops)
- Don't mutate state directly — always create new objects/arrays
- `React.memo` without `useCallback` on passed functions = no benefit (and both are redundant if React Compiler is active)
- Adding `useMemo`/`useCallback` in a React Compiler project causes conflicts — verify compiler status before memoizing manually
