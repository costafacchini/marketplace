# Task: Admin Create/Edit Forms + Cloudinary Widget

**Plan**: marketplace-filha
**Phase**: 4
**Task ID (phase-local)**: task-09
**Task Path**: phase-4/task-09-admin-forms
**Spec References**: Story 5 (P2) — all 5 scenarios, FR-007, FR-009, FR-011, SC-002, SC-006
**Depends On**: phase-4/task-08-admin-list
**JIRA**: N/A

## Objective

Implement the product create and edit forms with client-side + server-side validation (zod), and integrate the Cloudinary Upload Widget for direct browser-to-Cloudinary photo upload.

## Context

Reference `docs/sdd.md` sections 7 (Cloudinary Integration), 9 (Component Hierarchy), and 4 (API Contracts — POST/PUT).

Key Cloudinary notes from the SDD:
- Use **unsigned upload preset** (configured in Cloudinary dashboard)
- Widget loads via CDN script tag (or dynamic import)
- Only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are needed (no API key/secret for unsigned)
- `onSuccess` callback: push returned `secure_url` to the form's `images` array field

Form uses **react-hook-form** + **zod resolver**. Same `ProductForm` component handles both create and edit modes (controlled by presence of `initialData` prop).

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-4/task-08-admin-list` status is `complete`
- [ ] Read `docs/sdd.md` sections 7 and 9
- [ ] Ensure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are in `.env.local`
- [ ] Verify an unsigned upload preset exists in your Cloudinary account
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/(admin)/admin/products/new/page.tsx` | create | Create page — renders ProductForm |
| `app/(admin)/admin/products/[id]/edit/page.tsx` | create | Edit page — fetches product, renders ProductForm |
| `components/admin/ProductForm.tsx` | create | Shared form (create + edit mode) |
| `components/admin/CloudinaryWidget.tsx` | create | Cloudinary Upload Widget integration |
| `components/admin/ImagePreview.tsx` | create | Preview grid for uploaded images |

### Do NOT Modify

- `app/(admin)/admin/page.tsx` — owned by task-08-admin-list
- `components/admin/ProductTable.tsx` — owned by task-08-admin-list
- `components/admin/ActiveToggle.tsx` — owned by task-08-admin-list
- `lib/validations/product.ts` — created by task-04; this task READS it, does not modify it

## Implementation Steps

### Step 1: Create components/admin/CloudinaryWidget.tsx

```typescript
'use client'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onUpload: (url: string) => void
}

export function CloudinaryWidget({ onUpload }: Props) {
  const widgetRef = useRef<unknown>(null)

  useEffect(() => {
    // Load Cloudinary script dynamically
    const script = document.createElement('script')
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  function openWidget() {
    const cloudinary = (window as any).cloudinary
    if (!cloudinary) return
    if (!widgetRef.current) {
      widgetRef.current = cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          sources: ['local', 'camera'],
          multiple: true,
          maxFiles: 6,
          resourceType: 'image',
        },
        (_error: unknown, result: { event: string; info: { secure_url: string } }) => {
          if (result.event === 'success') {
            onUpload(result.info.secure_url)
          }
        }
      )
    }
    ;(widgetRef.current as any).open()
  }

  return <Button type="button" onClick={openWidget}>Adicionar Fotos</Button>
}
```

### Step 2: Create components/admin/ImagePreview.tsx

Displays a responsive grid of uploaded images (from the form's `images` array). Each image has a remove button (×) that calls a provided `onRemove(index)` callback.

### Step 3: Create components/admin/ProductForm.tsx

Client Component using react-hook-form + zod:

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productCreateSchema, ProductCreateInput } from '@/lib/validations/product'
import { CloudinaryWidget } from './CloudinaryWidget'
import { ImagePreview } from './ImagePreview'
import { useRouter } from 'next/navigation'

interface Props {
  initialData?: Partial<ProductCreateInput> & { id?: string }
}

const CATEGORY_OPTIONS = [
  { value: 'CLOTHES', label: 'Roupas' },
  { value: 'LINGERIE', label: 'Íntimas' },
  { value: 'WORKOUT', label: 'Academia' },
]

const SIZE_OPTIONS = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Único']

export function ProductForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const form = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: initialData ?? { active: true, sizes: [], images: [] },
  })

  const images = form.watch('images')
  const sizes = form.watch('sizes')

  function handleUpload(url: string) {
    form.setValue('images', [...images, url])
  }

  function removeImage(index: number) {
    form.setValue('images', images.filter((_, i) => i !== index))
  }

  function toggleSize(size: string) {
    if (sizes.includes(size)) {
      form.setValue('sizes', sizes.filter(s => s !== size))
    } else {
      form.setValue('sizes', [...sizes, size])
    }
  }

  async function onSubmit(data: ProductCreateInput) {
    const url = isEdit ? `/api/products/${initialData!.id}` : '/api/products'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      // Server validation errors
      const body = await res.json()
      // Display server errors — set form errors from body.error
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Name, Description, Price, Category, Sizes, Images fields */}
      {/* ... render fields with react-hook-form register() and error messages */}
      <CloudinaryWidget onUpload={handleUpload} />
      <ImagePreview images={images} onRemove={removeImage} />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {isEdit ? 'Salvar Alterações' : 'Criar Produto'}
      </Button>
    </form>
  )
}
```

Implement all form fields:
- **Name**: text input, required
- **Description**: textarea, optional
- **Price**: number input (step=0.01), required
- **Category**: Select dropdown with CATEGORY_OPTIONS
- **Sizes**: toggle button group with SIZE_OPTIONS (multi-select)
- **Images**: CloudinaryWidget + ImagePreview (min 1 image, enforced by zod)
- **Active** (edit only): Switch toggle

### Step 4: Create app/(admin)/admin/products/new/page.tsx

```typescript
import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1>Novo Produto</h1>
      <ProductForm />
    </div>
  )
}
```

### Step 5: Create app/(admin)/admin/products/[id]/edit/page.tsx

Server Component — fetches product, renders form with `initialData`:
```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) notFound()

  return (
    <div>
      <h1>Editar Produto</h1>
      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description ?? undefined,
          price: Number(product.price),
          category: product.category,
          sizes: product.sizes,
          images: product.images,
          active: product.active,
        }}
      />
    </div>
  )
}
```

## Testing

Test stubs at `__tests__/admin/product-form.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 5 / Scenario 1: **Given** all required fields filled and ≥1 photo uploaded, **When** "Criar Produto" clicked, **Then** `POST /api/products` called, product created, redirected to `/admin` — `__tests__/admin/product-form.test.tsx`
- [ ] Story 5 / Scenario 2: **Given** required fields missing, **When** form submitted, **Then** field-level error messages shown, form not submitted — `__tests__/admin/product-form.test.tsx`
- [ ] Story 5 / Scenario 3: **Given** admin on edit page with initialData, **When** fields updated and saved, **Then** `PUT /api/products/[id]` called — `__tests__/admin/product-form.test.tsx`
- [ ] Story 5 / Scenario 4: **Given** admin on edit page, **When** "Ativo" switch toggled and saved, **Then** `PUT` called with `{ active: false/true }` — `__tests__/admin/product-form.test.tsx`
- [ ] Story 5 / Scenario 5: **Given** Cloudinary Widget fires `onSuccess`, **When** result has secure_url, **Then** URL is appended to form images array — `__tests__/admin/CloudinaryWidget.test.tsx`

**Additional verification**:
- [ ] At least 1 image required — form cannot submit with empty `images[]`
- [ ] At least 1 size required — form cannot submit with empty `sizes[]`
- [ ] Price field accepts decimals with 2 decimal places
- [ ] Server errors (400 from API) are displayed in the form

## Documentation / KB Updates

- [ ] Run `document-solution` after this task — Cloudinary Upload Widget + react-hook-form + App Router is a non-obvious integration pattern worth preserving in KB
- [ ] Run `check-kb-index` after adding the KB doc

## Completion Criteria

- [ ] All 5 Story 5 scenarios pass
- [ ] Form blocks submission when images or sizes are empty
- [ ] Cloudinary Widget uploads and returns URL to form
- [ ] Edit page pre-fills form with existing product data
- [ ] Server validation errors are surfaced in the UI
- [ ] Changes committed to `plan/marketplace-filha/phase-4/task-09-admin-forms` branch
- [ ] Status updated in `status.md`
