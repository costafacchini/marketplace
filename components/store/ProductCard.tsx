'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import type { SerializedProduct } from './CategoryFilter'

interface ProductCardProps {
  product: SerializedProduct
}

const PLACEHOLDER_IMAGE = '/placeholder-product.png'

export function ProductCard({ product }: ProductCardProps) {
  const { id, name, images, originalPrice, promotionalPrice } = product
  const imageSrc = images[0] ?? PLACEHOLDER_IMAGE
  const hasPromo = promotionalPrice !== null

  const discountPct = hasPromo
    ? Math.round((1 - Number(promotionalPrice) / Number(originalPrice)) * 100)
    : 0

  return (
    <Link href={`/products/${id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {hasPromo && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
              {discountPct}% OFF
            </span>
          )}
        </div>
        <CardContent className="px-2 pb-3 pt-1">
          <p className="line-clamp-2 text-sm mt-1">{name}</p>
          {hasPromo ? (
            <div className="flex flex-col mt-1">
              <span className="font-bold text-red-500 text-sm">
                {formatPrice(promotionalPrice!)}
              </span>
              <span
                className="line-through text-muted-foreground text-sm"
                data-testid={`original-price-${id}`}
              >
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
