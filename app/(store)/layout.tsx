import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { CartBadge } from '@/components/store/CartBadge'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('store')

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-circle.jpeg"
              alt={t('name')}
              width={36}
              height={36}
              className="rounded-full object-cover"
              priority
            />
            <span className="font-bold text-lg tracking-tight">{t('name')}</span>
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1 min-h-[44px] px-2"
          >
            <CartBadge />
            <span className="text-sm">{t('navCart')}</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
