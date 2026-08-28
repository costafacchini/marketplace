'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CloudinaryWidget } from '@/components/admin/CloudinaryWidget'
import { ImagePreview } from '@/components/admin/ImagePreview'
import { productCreateSchema, type ProductCreateInput } from '@/lib/validations/product'

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Único'] as const
const CATEGORIES = ['CLOTHES', 'LINGERIE', 'WORKOUT'] as const

interface Props {
  initialData?: Partial<ProductCreateInput> & { id?: string }
}

export function ProductForm({ initialData }: Props) {
  const t = useTranslations('admin.products.form')
  const tCategory = useTranslations('admin.products.category')
  const router = useRouter()
  const isEdit = Boolean(initialData?.id)

  const form = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    mode: 'onSubmit',
    defaultValues: isEdit
      ? {
          name: initialData?.name ?? '',
          description: initialData?.description ?? undefined,
          price: initialData?.price ?? 0,
          category: initialData?.category ?? 'CLOTHES',
          sizes: initialData?.sizes ?? [],
          images: initialData?.images ?? [],
          active: initialData?.active ?? true,
        }
      : {
          name: '',
          description: undefined,
          price: 0,
          category: 'CLOTHES',
          sizes: [],
          images: [],
          active: true,
        },
  })

  const [serverError, setServerError] = useState<string | null>(null)

  const images = form.watch('images')
  const sizes = form.watch('sizes')
  const active = form.watch('active')

  function toggleSize(size: string) {
    const current = form.getValues('sizes')
    if (current.includes(size)) {
      form.setValue('sizes', current.filter((s) => s !== size), { shouldValidate: true })
    } else {
      form.setValue('sizes', [...current, size], { shouldValidate: true })
    }
  }

  function handleUpload(url: string) {
    const current = form.getValues('images')
    form.setValue('images', [...current, url], { shouldValidate: true })
  }

  function removeImage(index: number) {
    const current = form.getValues('images')
    form.setValue(
      'images',
      current.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  async function onSubmit(data: ProductCreateInput) {
    setServerError(null)
    const url = isEdit ? `/api/products/${initialData!.id}` : '/api/products'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      setServerError(t('serverError'))
      return
    }

    router.push('/admin')
    router.refresh()
  }

  const submitLabel = form.formState.isSubmitting
    ? t('submitting')
    : isEdit
      ? t('submitEdit')
      : t('submitCreate')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">{t('name')}</Label>
        <Input
          id="name"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t('description')}</Label>
        <textarea
          id="description"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register('description')}
        />
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label htmlFor="price">{t('price')}</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...form.register('price', { valueAsNumber: true })}
          aria-invalid={!!form.formState.errors.price}
        />
        {form.formState.errors.price && (
          <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <Label htmlFor="category">{t('category')}</Label>
        <select
          id="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register('category')}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {tCategory(cat.toLowerCase() as 'clothes' | 'lingerie' | 'workout')}
            </option>
          ))}
        </select>
        {form.formState.errors.category && (
          <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
        )}
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <Label>{t('sizes')}</Label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const isSelected = sizes.includes(size)
            return (
              <Button
                key={size}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                data-selected={isSelected || undefined}
                onClick={() => toggleSize(size)}
              >
                {size}
              </Button>
            )
          })}
        </div>
        {form.formState.errors.sizes && (
          <p className="text-sm text-destructive">{form.formState.errors.sizes.message}</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>{t('images')}</Label>
        <CloudinaryWidget onUpload={handleUpload} />
        <ImagePreview images={images} onRemove={removeImage} />
        {form.formState.errors.images && (
          <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
        )}
      </div>

      {/* Active (edit only) */}
      {isEdit && (
        <div className="flex items-center gap-3">
          <Switch
            checked={active}
            onCheckedChange={(val) => form.setValue('active', val)}
          />
          <Label>{t('active')}</Label>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  )
}
