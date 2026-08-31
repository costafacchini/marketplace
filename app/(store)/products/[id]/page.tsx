import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getActivePriceLists, resolvePrice } from '@/lib/pricing'
import { ImageGallery } from '@/components/store/ImageGallery'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { formatPrice } from '@/lib/format'

interface PageProps {
  params: { id: string }
}

export default async function ProductPage({ params }: PageProps) {
  const t = await getTranslations('store.product')
  const product = await prisma.product.findUnique({ where: { id: params.id } })

  if (!product || !product.active) notFound()

  const activeLists = await getActivePriceLists()
  const promoPrice = resolvePrice(product.id, product.category, product.price, activeLists)
  const discountPct = promoPrice
    ? Math.round((1 - Number(promoPrice) / Number(product.price)) * 100)
    : 0

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('backToStore')}
      </Link>
      <ImageGallery images={product.images} name={product.name} />
      <h1 className="text-xl font-bold mt-4">{product.name}</h1>
      {promoPrice ? (
        <div className="flex items-baseline gap-2 flex-wrap mt-1">
          <span className="text-lg font-bold text-deal">
            <span className="sr-only">{t('promoPrice')}: </span>
            {formatPrice(promoPrice.toString())}
          </span>
          <span className="bg-deal text-deal-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {discountPct}% {t('offLabel')}
          </span>
          <span className="text-sm line-through text-muted-foreground">
            <span className="sr-only">{t('originalPrice')}: </span>
            {formatPrice(product.price.toString())}
          </span>
        </div>
      ) : (
        <p className="text-lg font-semibold mt-1">{formatPrice(product.price.toString())}</p>
      )}
      {product.description && (
        <p className="text-base text-foreground leading-relaxed mt-3">{product.description}</p>
      )}
      <AddToCartButton
        productId={product.id}
        name={product.name}
        price={promoPrice ? Number(promoPrice.toString()) : Number(product.price.toString())}
        image={product.images[0] ?? '/placeholder-product.png'}
        sizes={product.sizes}
      />
    </main>
  )
}
