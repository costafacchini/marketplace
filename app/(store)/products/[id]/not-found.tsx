import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export default async function ProductNotFound() {
  const t = await getTranslations('store.product')

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="flex justify-center mb-4">
        <PackageSearch className="size-10 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold mb-2">{t('notFoundTitle')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('notFoundDescription')}</p>
      <Button asChild className="min-h-[44px]">
        <Link href="/">{t('notFoundCta')}</Link>
      </Button>
    </main>
  )
}
