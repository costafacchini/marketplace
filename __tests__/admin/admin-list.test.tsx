import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProductTable } from '@/components/admin/ProductTable'

// Mock next/navigation
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ refresh: mockRefresh }),
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

// Mock next-intl — key pass-through
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}))

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Blue Dress',
    category: 'CLOTHES' as const,
    price: '99.90',
    active: true,
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'prod-2',
    name: 'Sports Bra',
    category: 'WORKOUT' as const,
    price: '49.00',
    active: false,
    createdAt: new Date('2026-01-02'),
  },
  {
    id: 'prod-3',
    name: 'Lace Set',
    category: 'LINGERIE' as const,
    price: '129.50',
    active: true,
    createdAt: new Date('2026-01-03'),
  },
]

describe('ProductTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all product names', () => {
    render(<ProductTable products={mockProducts} />)
    expect(screen.getByText('Blue Dress')).toBeInTheDocument()
    expect(screen.getByText('Sports Bra')).toBeInTheDocument()
    expect(screen.getByText('Lace Set')).toBeInTheDocument()
  })

  it('renders translated category labels for each product', () => {
    render(<ProductTable products={mockProducts} />)
    // useTranslations is a pass-through: returns the key
    expect(screen.getByText('category.clothes')).toBeInTheDocument()
    expect(screen.getByText('category.workout')).toBeInTheDocument()
    expect(screen.getByText('category.lingerie')).toBeInTheDocument()
  })

  it('renders formatted price for each product', () => {
    render(<ProductTable products={mockProducts} />)
    // Prices formatted as BRL
    expect(screen.getByText(/R\$\s*99[,.]90/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*49[,.]00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*129[,.]50/)).toBeInTheDocument()
  })

  it('shows "status.active" badge for active product', () => {
    render(<ProductTable products={mockProducts} />)
    const activeBadges = screen.getAllByText('status.active')
    expect(activeBadges.length).toBeGreaterThan(0)
  })

  it('shows "status.inactive" badge for inactive product', () => {
    render(<ProductTable products={mockProducts} />)
    expect(screen.getByText('status.inactive')).toBeInTheDocument()
  })

  it('renders edit links pointing to the correct product edit URL', () => {
    render(<ProductTable products={mockProducts} />)
    const editLinks = screen.getAllByRole('link', { name: /table\.edit/i })
    const hrefs = editLinks.map((el) => el.getAttribute('href'))
    expect(hrefs).toContain('/admin/products/prod-1/edit')
    expect(hrefs).toContain('/admin/products/prod-2/edit')
    expect(hrefs).toContain('/admin/products/prod-3/edit')
  })
})
