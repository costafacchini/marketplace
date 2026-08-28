import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveToggle } from '@/components/admin/ActiveToggle'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ refresh: mockRefresh }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ActiveToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('renders Switch with checked=true when active is true', () => {
    render(<ActiveToggle id="prod-1" active={true} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeChecked()
  })

  it('renders Switch with checked=false when active is false', () => {
    render(<ActiveToggle id="prod-1" active={false} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).not.toBeChecked()
  })

  it('calls fetch PUT with toggled active value when switched', async () => {
    const user = userEvent.setup()
    render(<ActiveToggle id="prod-1" active={true} />)

    await user.click(screen.getByRole('switch'))

    expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
  })

  it('calls fetch PUT with active=true when toggling from inactive', async () => {
    const user = userEvent.setup()
    render(<ActiveToggle id="prod-2" active={false} />)

    await user.click(screen.getByRole('switch'))

    expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    })
  })

  it('calls router.refresh() after toggling', async () => {
    const user = userEvent.setup()
    render(<ActiveToggle id="prod-1" active={true} />)

    await user.click(screen.getByRole('switch'))

    // wait for async toggle to finish
    await screen.findByRole('switch')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })
})
