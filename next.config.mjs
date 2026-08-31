import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://upload-widget.cloudinary.com",
      "frame-src https://upload-widget.cloudinary.com",
      "img-src 'self' data: https://res.cloudinary.com http://localhost:9000",
      "connect-src 'self' https://api.cloudinary.com http://localhost:9000",
      "style-src 'self' 'unsafe-inline'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      ...(process.env.NEXT_PUBLIC_STORAGE_PROVIDER === 'minio'
        ? [{ protocol: 'http', hostname: 'localhost', port: '9000' }]
        : []),
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default withNextIntl(nextConfig)
