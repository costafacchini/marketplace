import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PriceListForm } from '@/components/admin/PriceListForm'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: (ns: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'admin.priceLists.form': {
        name: 'Name',
        discountPct: 'Discount %',
        startsAt: 'Starts at',
        expiresAt: 'Expires at',
        active: 'Active',
        categories: 'Categories',
        products: 'Specific products (optional)',
        save: 'Save',
        saving: 'Saving...',
        dateError: 'Expiry must be after start date.',
      },
    }
    return translations[ns]?.[key] ?? key
  },
}))

// Mock ProductSelector to simplify form tests
jest.mock('@/components/admin/ProductSelector', () => ({
  __esModule: true,
  ProductSelector: ({ onChange }: { onChange: (items: unknown[]) => void }) => (
    <button type="button" onClick={() => onChange([])}>ProductSelector</button>
  ),
}))

// Mock Switch to avoid ResizeObserver dependency from Radix UI in jsdom
jest.mock('@/components/ui/switch', () => ({
  __esModule: true,
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      switch
    </button>
  ),
}))

// Mock Checkbox to avoid Radix UI issues in jsdom
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
    />
  ),
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('PriceListForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ priceList: { id: 'new-id' } }),
    })
  })

  it('renders form fields', () => {
    render(<PriceListForm />)
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Discount %/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Starts at/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Expires at/i)).toBeInTheDocument()
  })

  it('calls POST /api/price-lists on valid submit and redirects', async () => {
    const user = userEvent.setup()
    render(<PriceListForm />)

    await user.type(screen.getByLabelText(/Name/i), 'Summer Sale')
    fireEvent.change(screen.getByLabelText(/Discount %/i), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText(/Starts at/i), { target: { value: '2026-09-01T00:00' } })
    fireEvent.change(screen.getByLabelText(/Expires at/i), { target: { value: '2026-09-30T23:59' } })

    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/price-lists',
        expect.objectContaining({ method: 'POST' })
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/price-lists')
    })
  })

  it('shows date validation error when expiresAt is before startsAt', async () => {
    const user = userEvent.setup()
    render(<PriceListForm />)

    await user.type(screen.getByLabelText(/Name/i), 'Bad Dates')
    fireEvent.change(screen.getByLabelText(/Discount %/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Starts at/i), { target: { value: '2026-09-30T00:00' } })
    fireEvent.change(screen.getByLabelText(/Expires at/i), { target: { value: '2026-09-01T00:00' } })

    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(screen.getByText('Expiry must be after start date.')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls PUT /api/price-lists/[id] in edit mode', async () => {
    const user = userEvent.setup()
    const initialData = {
      name: 'Existing List',
      discountPct: '15.00',
      startsAt: '2026-08-01T00:00',
      expiresAt: '2026-08-31T23:59',
      active: true,
      categories: [] as string[],
      selectedProducts: [] as Array<{ productId: string; discountPct?: number }>,
    }

    render(<PriceListForm initialData={initialData} listId="list-99" />)

    // Clear name and type new one
    const nameInput = screen.getByLabelText(/Name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated List')

    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/price-lists/list-99',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('includes active: false in body when toggle is off', async () => {
    const user = userEvent.setup()
    const initialData = {
      name: 'Inactive List',
      discountPct: '10.00',
      startsAt: '2026-08-01T00:00',
      expiresAt: '2026-08-31T23:59',
      active: false,
      categories: [] as string[],
      selectedProducts: [] as Array<{ productId: string; discountPct?: number }>,
    }

    render(<PriceListForm initialData={initialData} listId="list-inactive" />)

    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.active).toBe(false)
    })
  })
})
