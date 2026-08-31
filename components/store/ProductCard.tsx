'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import type { SerializedProduct } from './CategoryFilter'

interface ProductCardProps {
  product: SerializedProduct
}

const PLACEHOLDER_IMAGE = '/placeholder-product.png'

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('store.product')
  const router = useRouter()
  const { id, name, images, originalPrice, promotionalPrice } = product
  const hasPromo = promotionalPrice !== null
  const total = images.length
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)

  const discountPct = hasPromo
    ? Math.round((1 - Number(promotionalPrice) / Number(originalPrice)) * 100)
    : 0

  const imageSrc = total > 0 ? images[index] : PLACEHOLDER_IMAGE

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    didSwipe.current = false
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (total > 1 && Math.abs(dx) > 30) {
      didSwipe.current = true
      setIndex((i) => (dx < 0 ? (i + 1) % total : (i - 1 + total) % total))
    }
    touchStartX.current = null
  }

  function handleImageClick() {
    if (!didSwipe.current) router.push(`/products/${id}`)
    didSwipe.current = false
  }

  return (
    <Card className="overflow-hidden hover:shadow-md motion-safe:transition-shadow">
      {/* touch-action:pan-y tells browser to handle vertical scroll but let JS own horizontal swipe */}
      <div
        role="button"
        tabIndex={0}
        aria-label={name}
        className="relative aspect-square overflow-hidden cursor-pointer"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/products/${id}`)}
      >
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {hasPromo && (
          <span className="absolute top-2 left-2 bg-deal text-deal-foreground text-xs font-bold px-2 py-1 rounded-full z-10 motion-safe:animate-[badge-pop_0.3s_ease-out]">
            {discountPct}% {t('offLabel')}
          </span>
        )}
        {total > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`block h-1 rounded-full transition-all ${
                  i === index ? 'w-3 bg-white' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <Link href={`/products/${id}`} tabIndex={-1}>
        <CardContent className="px-2 pb-3 pt-1">
          <p className="line-clamp-2 text-sm mt-1">{name}</p>
          {hasPromo ? (
            <div className="flex flex-col mt-1">
              <span className="font-bold text-deal text-sm">
                <span className="sr-only">{t('promoPrice')}: </span>
                {formatPrice(promotionalPrice!)}
              </span>
              <span
                className="line-through text-muted-foreground text-sm"
                data-testid={`original-price-${id}`}
              >
                <span className="sr-only">{t('originalPrice')}: </span>
                {formatPrice(originalPrice)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-medium mt-1 block">{formatPrice(originalPrice)}</span>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
