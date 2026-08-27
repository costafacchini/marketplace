# Vue Conventions

**Last Updated**: 2026-03-29
**Context**: When building Vue components or features

## Components (Composition API)
- Use `<script setup>` for single-file components
- PascalCase for component filenames and registration
- Props: use `defineProps<{}>()` with TypeScript types
- Emits: use `defineEmits<{}>()` with TypeScript types
- One component per file

## Reactivity
- `ref()` for primitives, `reactive()` for objects
- Access `ref` values with `.value` in script, auto-unwrapped in template
- Use `computed()` for derived state — never store derived data in refs
- Use `watch()` / `watchEffect()` sparingly — prefer computed
- `toRefs()` when destructuring reactive objects to preserve reactivity

## Composables
- Prefix with `use` (e.g., `useAuth`, `useFetch`)
- Return reactive state and methods as a plain object
- Keep composables focused on one concern
- Use composables instead of mixins (deprecated pattern)

## Templates
- `v-if` for conditional rendering, `v-show` for frequent toggles
- Always use `:key` on `v-for` — never use index if items reorder
- Use `v-model` for two-way binding on form inputs
- Prefer `@click` shorthand over `v-on:click`

## Common Pitfalls
- Losing reactivity by destructuring `reactive()` — use `toRefs()`
- `ref()` of objects: `.value` returns the reactive object, don't double-wrap
- Template refs (`ref="el"`) type: `ref<HTMLElement | null>(null)`
- Async components in `<Suspense>` — handle loading/error states
