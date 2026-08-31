import { getTranslations } from 'next-intl/server'

export default async function StoreLoading() {
  const t = await getTranslations('store')

  return (
    <main
      className="container mx-auto px-4 py-6"
      role="status"
      aria-busy="true"
      aria-label={t('loadingStatus')}
    >
      <div className="mb-6">
        <div className="h-7 bg-muted animate-pulse rounded w-48" />
        <div className="h-4 bg-muted animate-pulse rounded w-56 mt-1.5" />
      </div>

      <div className="flex items-start gap-2 mb-4">
        <div className="flex-1 flex flex-wrap gap-1">
          <div className="min-h-[44px] w-[72px] rounded-md bg-muted animate-pulse" />
          <div className="min-h-[44px] w-[64px] rounded-md bg-muted animate-pulse" />
          <div className="min-h-[44px] w-[60px] rounded-md bg-muted animate-pulse" />
          <div className="min-h-[44px] w-[72px] rounded-md bg-muted animate-pulse" />
        </div>
        <div className="min-h-[44px] w-[90px] rounded-md bg-muted animate-pulse shrink-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border">
            <div className="aspect-square bg-muted animate-pulse" />
            <div className="px-2 pb-3 pt-1 space-y-1.5">
              <div className="h-3 bg-muted animate-pulse rounded w-3/4 mt-1" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
