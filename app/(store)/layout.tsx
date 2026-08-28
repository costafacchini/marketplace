import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('store')

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            {t('name')}
          </Link>
          <Link
            href="/cart"
            aria-label={t('cart')}
            className="flex items-center gap-1 min-h-[44px] px-2"
          >
            <ShoppingCart className="size-5" />
            <span className="text-sm">{t('cart')}</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
