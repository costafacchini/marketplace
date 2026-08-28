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
  const product = await prisma.product.findUnique({ where: { id: params.id } })

  if (!product || !product.active) notFound()

  const activeLists = await getActivePriceLists()
  const promoPrice = resolvePrice(product.id, product.category, product.price, activeLists)

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <ImageGallery images={product.images} name={product.name} />
      <h1 className="text-xl font-bold mt-4">{product.name}</h1>
      {promoPrice ? (
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-bold text-red-600">
            {formatPrice(promoPrice.toString())}
          </span>
          <span className="text-sm line-through text-muted-foreground">
            {formatPrice(product.price.toString())}
          </span>
        </div>
      ) : (
        <p className="text-lg font-semibold mt-1">{formatPrice(product.price.toString())}</p>
      )}
      {product.description && (
        <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
      )}
      <AddToCartButton
        productId={product.id}
        name={product.name}
        price={promoPrice ? Number(promoPrice.toString()) : Number(product.price.toString())}
        image={product.images[0] ?? ''}
        sizes={product.sizes}
      />
    </main>
  )
}
