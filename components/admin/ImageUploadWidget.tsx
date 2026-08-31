'use client'
import { CloudinaryWidget } from './CloudinaryWidget'
import { MinioUploadButton } from './MinioUploadButton'

interface Props {
  onUpload: (url: string) => void
}

export function ImageUploadWidget({ onUpload }: Props) {
  if (process.env.NEXT_PUBLIC_STORAGE_PROVIDER === 'minio') {
    return <MinioUploadButton onUpload={onUpload} />
  }
  return <CloudinaryWidget onUpload={onUpload} />
}
