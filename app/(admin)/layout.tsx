import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/admin/SessionProvider'
import { SignOutButton } from '@/components/admin/SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations()
  const session = await getServerSession(authOptions)

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        {session && (
          <header className="border-b px-6 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium hover:underline">
                Admin
              </Link>
              <Link href="/admin/price-lists" className="text-sm font-medium hover:underline">
                {t('admin.priceLists.nav')}
              </Link>
            </nav>
            <SignOutButton label={t('admin.login.signOut')} />
          </header>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </SessionProvider>
  )
}
