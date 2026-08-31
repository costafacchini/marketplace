'use client'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface Props {
  onUpload: (url: string) => void
}

export function MinioUploadButton({ onUpload }: Props) {
  const t = useTranslations('admin.products.form')
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    try {
      await Promise.all(
        files.map(async (file) => {
          const body = new FormData()
          body.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body })
          if (!res.ok) throw new Error(await res.text())
          const { url } = await res.json()
          onUpload(url)
        })
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? t('uploading') : t('addPhotos')}
      </Button>
    </>
  )
}
