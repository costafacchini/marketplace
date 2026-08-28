'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

export interface SelectedProduct {
  productId: string
  discountPct?: number
}

interface ProductOption {
  id: string
  name: string
  category: string
}

interface Props {
  value: SelectedProduct[]
  onChange: (items: SelectedProduct[]) => void
}

export function ProductSelector({ value, onChange }: Props) {
  const t = useTranslations('admin.priceLists.form')
  const [products, setProducts] = useState<ProductOption[]>([])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
  }, [])

  function toggle(productId: string) {
    const existing = value.find(v => v.productId === productId)
    onChange(
      existing
        ? value.filter(v => v.productId !== productId)
        : [...value, { productId }]
    )
  }

  function setOverride(productId: string, pct: number | undefined) {
    onChange(
      value.map(v => (v.productId === productId ? { ...v, discountPct: pct } : v))
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
      {products.map(p => {
        const sel = value.find(v => v.productId === p.id)
        return (
          <div key={p.id} className="flex items-center gap-3">
            <Checkbox
              id={`ps-${p.id}`}
              checked={!!sel}
              onCheckedChange={() => toggle(p.id)}
            />
            <label htmlFor={`ps-${p.id}`} className="flex-1 text-sm cursor-pointer">
              {p.name}{' '}
              <span className="text-muted-foreground">({p.category})</span>
            </label>
            {sel && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder={t('overridePct')}
                  className="w-24 h-7 text-xs"
                  value={sel.discountPct ?? ''}
                  onChange={e =>
                    setOverride(
                      p.id,
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <span className="text-xs">%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
