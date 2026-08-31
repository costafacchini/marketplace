'use client'
import Image from 'next/image'
import Link from 'next/link'
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
  const { id, name, images, originalPrice, promotionalPrice } = product
  const imageSrc = images[0] ?? PLACEHOLDER_IMAGE
  const hasPromo = promotionalPrice !== null

  const discountPct = hasPromo
    ? Math.round((1 - Number(promotionalPrice) / Number(originalPrice)) * 100)
    : 0

  return (
    <Link href={`/products/${id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md motion-safe:transition-shadow">
        <div className="relative aspect-square overflow-hidden">
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
        </div>
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
      </Card>
    </Link>
  )
}
