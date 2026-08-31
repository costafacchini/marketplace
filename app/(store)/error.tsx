'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('store.error')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="flex justify-center mb-4">
        <AlertCircle className="size-10 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('description')}</p>
      <Button onClick={reset} className="min-h-[44px]">{t('retry')}</Button>
    </main>
  )
}
