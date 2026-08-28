import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/admin/LoginForm'

// Mock next-auth/react
const mockSignIn = jest.fn()
jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}))

// Mock next/navigation
const mockSearchParamsGet = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useSearchParams: () => ({ get: mockSearchParamsGet }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'admin.login.title': 'Admin Login',
      'admin.login.email': 'Email',
      'admin.login.password': 'Password',
      'admin.login.submit': 'Sign in',
      'admin.login.submitting': 'Signing in...',
      'admin.login.invalidCredentials': 'Invalid email or password.',
    }
    return translations[key] ?? key
  },
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
  })

  it('renders email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows invalidCredentials error when ?error=CredentialsSignin is in URL', () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'error' ? 'CredentialsSignin' : null
    )
    render(<LoginForm />)
    expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
  })

  it('does not show error when no error param', () => {
    render(<LoginForm />)
    expect(screen.queryByText('Invalid email or password.')).not.toBeInTheDocument()
  })

  it('calls signIn with correct arguments on submit', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@example.com',
        password: 'secret123',
        callbackUrl: '/admin',
      })
    })
  })

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup()
    // Return a promise that never resolves to keep loading state visible
    mockSignIn.mockReturnValue(new Promise(() => {}))
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signing in/i })
      ).toBeDisabled()
    })
  })
})
