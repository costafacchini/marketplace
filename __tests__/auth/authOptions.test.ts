/**
 * Tests for the authorize function inside authOptions.
 *
 * next-auth's CredentialsProvider stores the user-provided authorize callback
 * under `provider.options.authorize` (not `provider.authorize`, which is always
 * the default `() => null`).
 */
import { authOptions } from '@/lib/auth'
import type { CredentialsConfig } from 'next-auth/providers/credentials'

// Pre-computed bcryptjs hash for 'testpass'
// Generated with: bcryptjs.hash('testpass', 10)
const CORRECT_PASS = 'testpass'
const CORRECT_HASH = '$2b$10$5XCh4nWTNJjN3bbNDrCp1esoWp9.2jc9evm63hr8z65q.4FAVaGj.'

const credentialsProvider = authOptions.providers[0] as CredentialsConfig & {
  options: { authorize: NonNullable<CredentialsConfig['authorize']> }
}
const authorize = credentialsProvider.options.authorize

describe('authOptions.authorize', () => {
  const ADMIN_EMAIL = 'admin@example.com'

  beforeEach(() => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
    process.env.ADMIN_PASSWORD_HASH = CORRECT_HASH
  })

  afterEach(() => {
    delete process.env.ADMIN_EMAIL
    delete process.env.ADMIN_PASSWORD_HASH
  })

  it('returns null when credentials are missing', async () => {
    const result = await authorize(undefined, {} as Request)
    expect(result).toBeNull()
  })

  it('returns null when email does not match ADMIN_EMAIL', async () => {
    const result = await authorize(
      { email: 'wrong@example.com', password: CORRECT_PASS },
      {} as Request
    )
    expect(result).toBeNull()
  })

  it('returns null when password does not match hash', async () => {
    const result = await authorize(
      { email: ADMIN_EMAIL, password: 'wrongpassword' },
      {} as Request
    )
    expect(result).toBeNull()
  })

  it('returns user object when credentials are valid', async () => {
    const result = await authorize(
      { email: ADMIN_EMAIL, password: CORRECT_PASS },
      {} as Request
    )
    expect(result).toEqual({ id: '1', email: ADMIN_EMAIL, name: 'Admin' })
  })
})
