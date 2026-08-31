import { NextRequest, NextResponse } from 'next/server'
import { Upload } from '@aws-sdk/lib-storage'
import { s3, STORAGE_BUCKET, ensureBucket } from '@/lib/storage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureBucket()

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    },
  })

  await upload.done()

  const endpoint = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000'
  const url = `${endpoint}/${STORAGE_BUCKET}/${key}`

  return NextResponse.json({ url })
}
