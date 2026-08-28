import { getTranslations } from 'next-intl/server'
import { PriceListForm } from '@/components/admin/PriceListForm'

export default async function NewPriceListPage() {
  const t = await getTranslations('admin.priceLists')

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('new')}</h1>
      <PriceListForm />
    </div>
  )
}
