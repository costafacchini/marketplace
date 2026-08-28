import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { getTranslations } from 'next-intl/server'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('admin.products')
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('editProduct')}</h1>
      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description ?? undefined,
          price: Number(product.price),
          category: product.category,
          sizes: product.sizes,
          images: product.images,
          active: product.active,
        }}
      />
    </div>
  )
}
