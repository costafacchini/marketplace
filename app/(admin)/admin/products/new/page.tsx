import { ProductForm } from '@/components/admin/ProductForm'
import { getTranslations } from 'next-intl/server'

export default async function NewProductPage() {
  const t = await getTranslations('admin.products')
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('newProduct')}</h1>
      <ProductForm />
    </div>
  )
}
