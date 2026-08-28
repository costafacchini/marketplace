'use client'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  images: string[]
  onRemove: (index: number) => void
}

export function ImagePreview({ images, onRemove }: Props) {
  const t = useTranslations('admin.products.form')
  if (images.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((url, i) => (
        <div key={i} className="relative">
          <Image
            src={url}
            alt={t('imageAlt', { index: i + 1 })}
            width={120}
            height={120}
            className="object-cover rounded"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0 size-6"
            onClick={() => onRemove(i)}
            aria-label={t('removeImage')}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
