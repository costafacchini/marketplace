'use client'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface Props {
  onUpload: (url: string) => void
}

export function CloudinaryWidget({ onUpload }: Props) {
  const t = useTranslations('admin.products.form')
  const widgetRef = useRef<unknown>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  function openWidget() {
    const cloudinary = (window as unknown as Record<string, unknown>).cloudinary as {
      createUploadWidget: (
        config: Record<string, unknown>,
        callback: (error: unknown, result: { event: string; info: { secure_url: string } }) => void
      ) => { open: () => void }
    }
    if (!cloudinary) return
    if (!widgetRef.current) {
      widgetRef.current = cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          sources: ['local', 'camera'],
          multiple: true,
          maxFiles: 6,
          resourceType: 'image',
        },
        (_error: unknown, result: { event: string; info: { secure_url: string } }) => {
          if (result?.event === 'success') {
            onUpload(result.info.secure_url)
          }
        }
      )
    }
    ;(widgetRef.current as { open: () => void }).open()
  }

  return (
    <Button type="button" onClick={openWidget}>
      {t('addPhotos')}
    </Button>
  )
}
