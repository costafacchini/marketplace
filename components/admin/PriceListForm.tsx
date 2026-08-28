'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductSelector, type SelectedProduct } from '@/components/admin/ProductSelector'

const CATEGORIES = ['CLOTHES', 'LINGERIE', 'WORKOUT'] as const

const formSchema = z
  .object({
    name: z.string().min(1).max(200),
    discountPct: z.number().min(0.01).max(100).optional(),
    startsAt: z.string().min(1),
    expiresAt: z.string().min(1),
    active: z.boolean(),
    categories: z.array(z.enum(CATEGORIES)),
    selectedProducts: z.array(
      z.object({
        productId: z.string(),
        discountPct: z.number().optional(),
      })
    ),
  })
  .refine(data => new Date(data.expiresAt) > new Date(data.startsAt), {
    message: 'dateError',
    path: ['expiresAt'],
  })

type FormValues = z.infer<typeof formSchema>

export interface PriceListFormInitialData {
  name: string
  discountPct: string
  startsAt: string
  expiresAt: string
  active: boolean
  categories: string[]
  selectedProducts: SelectedProduct[]
}

interface Props {
  initialData?: PriceListFormInitialData
  listId?: string
}

export function PriceListForm({ initialData, listId }: Props) {
  const t = useTranslations('admin.priceLists.form')
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      discountPct: initialData?.discountPct ? Number(initialData.discountPct) : undefined,
      startsAt: initialData?.startsAt ?? '',
      expiresAt: initialData?.expiresAt ?? '',
      active: initialData?.active ?? true,
      categories: (initialData?.categories ?? []) as Array<'CLOTHES' | 'LINGERIE' | 'WORKOUT'>,
      selectedProducts: initialData?.selectedProducts ?? [],
    },
  })

  async function onSubmit(values: FormValues) {
    const url = listId ? `/api/price-lists/${listId}` : '/api/price-lists'
    const method = listId ? 'PUT' : 'POST'

    const body = {
      name: values.name,
      discountPct: values.discountPct,
      startsAt: values.startsAt,
      expiresAt: values.expiresAt,
      active: values.active,
      categories: values.categories,
      productIds: values.selectedProducts.map(p => p.productId),
      itemOverrides: Object.fromEntries(
        values.selectedProducts
          .filter(p => p.discountPct !== undefined)
          .map(p => [p.productId, p.discountPct!])
      ),
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/price-lists')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="plf-name">{t('name')}</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input id="plf-name" {...field} />}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Discount % */}
      <div className="space-y-1">
        <Label htmlFor="plf-discountPct">{t('discountPct')}</Label>
        <Controller
          name="discountPct"
          control={control}
          render={({ field }) => (
            <Input
              id="plf-discountPct"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />
        {errors.discountPct && (
          <p className="text-xs text-destructive">{errors.discountPct.message}</p>
        )}
      </div>

      {/* Starts at */}
      <div className="space-y-1">
        <Label htmlFor="plf-startsAt">{t('startsAt')}</Label>
        <Controller
          name="startsAt"
          control={control}
          render={({ field }) => (
            <Input id="plf-startsAt" type="datetime-local" {...field} />
          )}
        />
        {errors.startsAt && (
          <p className="text-xs text-destructive">{errors.startsAt.message}</p>
        )}
      </div>

      {/* Expires at */}
      <div className="space-y-1">
        <Label htmlFor="plf-expiresAt">{t('expiresAt')}</Label>
        <Controller
          name="expiresAt"
          control={control}
          render={({ field }) => (
            <Input id="plf-expiresAt" type="datetime-local" {...field} />
          )}
        />
        {errors.expiresAt && (
          <p className="text-xs text-destructive">
            {errors.expiresAt.message === 'dateError' ? t('dateError') : errors.expiresAt.message}
          </p>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Switch
              id="plf-active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="plf-active">{t('active')}</Label>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('categories')}</p>
        <Controller
          name="categories"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center gap-2">
                  <Checkbox
                    id={`plf-cat-${cat}`}
                    checked={field.value.includes(cat)}
                    onCheckedChange={checked => {
                      if (checked) {
                        field.onChange([...field.value, cat])
                      } else {
                        field.onChange(field.value.filter(c => c !== cat))
                      }
                    }}
                  />
                  <Label htmlFor={`plf-cat-${cat}`} className="cursor-pointer">
                    {cat}
                  </Label>
                </div>
              ))}
            </div>
          )}
        />
      </div>

      {/* Product overrides */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('products')}</p>
        <Controller
          name="selectedProducts"
          control={control}
          render={({ field }) => (
            <ProductSelector value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
