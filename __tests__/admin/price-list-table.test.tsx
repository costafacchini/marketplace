import React from 'react'
import { render, screen } from '@testing-library/react'
import { PriceListTable } from '@/components/admin/PriceListTable'

// Mock next/navigation
const mockRouterRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: (ns: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'admin.priceLists': {
        'table.name': 'Name',
        'table.discount': 'Discount',
        'table.starts': 'Starts',
        'table.expires': 'Expires',
        'table.status': 'Status',
        'table.actions': 'Actions',
        'table.edit': 'Edit',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'status.expired': 'Expired',
        'status.scheduled': 'Scheduled',
      },
    }
    return translations[ns]?.[key] ?? key
  },
}))

// Mock ActivePriceListToggle to avoid Switch ResizeObserver dependency in jsdom
jest.mock('@/components/admin/ActivePriceListToggle', () => ({
  __esModule: true,
  ActivePriceListToggle: ({ active }: { active: boolean }) => (
    <button role="switch" aria-checked={active}>toggle</button>
  ),
}))

const now = new Date()
const past = (offsetMs: number) => new Date(now.getTime() - offsetMs).toISOString()
const future = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString()
const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

function makeList(overrides: Record<string, unknown>) {
  return {
    id: 'list-1',
    name: 'Summer Sale',
    discountPct: '20.00',
    startsAt: past(ONE_DAY),
    expiresAt: future(ONE_DAY),
    active: true,
    categories: ['CLOTHES'],
    createdAt: past(ONE_DAY * 2),
    updatedAt: past(ONE_DAY),
    items: [],
    ...overrides,
  }
}

describe('PriceListTable', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders name and discount for each price list', () => {
    render(<PriceListTable priceLists={[makeList({ name: 'Winter Promo', discountPct: '15.00' })]} />)
    expect(screen.getByText('Winter Promo')).toBeInTheDocument()
    expect(screen.getByText('15.00%')).toBeInTheDocument()
  })

  it('shows Active badge when active and within date range', () => {
    render(<PriceListTable priceLists={[makeList({ active: true })]} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows Expired badge when active but expiresAt is in the past', () => {
    render(
      <PriceListTable
        priceLists={[
          makeList({
            active: true,
            startsAt: past(ONE_DAY * 3),
            expiresAt: past(ONE_HOUR),
          }),
        ]}
      />
    )
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('shows Scheduled badge when active but startsAt is in the future', () => {
    render(
      <PriceListTable
        priceLists={[
          makeList({
            active: true,
            startsAt: future(ONE_DAY),
            expiresAt: future(ONE_DAY * 2),
          }),
        ]}
      />
    )
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  it('shows Inactive badge when active is false', () => {
    render(<PriceListTable priceLists={[makeList({ active: false })]} />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders edit link for each row', () => {
    render(<PriceListTable priceLists={[makeList({ id: 'pl-42' })]} />)
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute(
      'href',
      '/admin/price-lists/pl-42/edit'
    )
  })

  it('renders column headers', () => {
    render(<PriceListTable priceLists={[]} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
