import { S3Client, PutBucketPolicyCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
})

export const STORAGE_BUCKET = process.env.MINIO_BUCKET ?? 'marketplace'

let bucketReady = false

export async function ensureBucket() {
  if (bucketReady) return

  try {
    await s3.send(new HeadBucketCommand({ Bucket: STORAGE_BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: STORAGE_BUCKET }))
  }

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: STORAGE_BUCKET,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${STORAGE_BUCKET}/*`],
          },
        ],
      }),
    })
  )

  bucketReady = true
}
