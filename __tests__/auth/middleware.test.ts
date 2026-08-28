/**
 * @jest-environment node
 */
import { config } from '@/middleware'

describe('middleware config', () => {
  it('protects /admin routes', () => {
    expect(config.matcher).toContain('/admin/:path*')
  })

  it('does not protect store routes (root /)', () => {
    const matchers = config.matcher as string[]
    const protectsRoot = matchers.some((m) => m === '/' || m === '(.*)')
    expect(protectsRoot).toBe(false)
  })
})
