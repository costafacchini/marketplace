'use client'
import { useTranslations } from 'next-intl'

interface Props {
  sizes: string[]
  value: string | null
  onChange: (size: string) => void
}

export function SizePicker({ sizes, value, onChange }: Props) {
  const t = useTranslations('store.product')
  return (
    <div>
      <p className="text-sm font-medium mb-2">{t('selectSize')}</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={`min-h-[44px] min-w-[44px] px-3 rounded border font-medium text-sm transition-colors ${
              value === size
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input hover:border-primary'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
