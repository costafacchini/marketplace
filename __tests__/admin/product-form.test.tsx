import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductForm } from '@/components/admin/ProductForm'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && 'index' in params) return `image-${params.index}`
    return key
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src} alt={props.alt} />
  },
}))

// Mock CloudinaryWidget to expose an onUpload trigger
let capturedOnUpload: ((url: string) => void) | null = null
jest.mock('@/components/admin/CloudinaryWidget', () => ({
  __esModule: true,
  CloudinaryWidget: ({ onUpload }: { onUpload: (url: string) => void }) => {
    capturedOnUpload = onUpload
    return (
      <button
        type="button"
        data-testid="cloudinary-widget"
        onClick={() => onUpload('https://res.cloudinary.com/test/image.jpg')}
      >
        addPhotos
      </button>
    )
  },
}))

// Mock Switch to avoid ResizeObserver issues
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

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnUpload = null
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ product: { id: 'new-id' } }),
    })
  })

  describe('Create mode', () => {
    it('renders all required form fields', () => {
      render(<ProductForm />)
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByText(/sizes/i)).toBeInTheDocument()
    })

    it('submits POST to /api/products with valid data', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      await user.type(screen.getByLabelText(/^name$/i), 'Test Dress')
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '99.90', valueAsNumber: 99.90 } })

      // Select a size
      const sizeButton = screen.getByRole('button', { name: /^M$/i })
      await user.click(sizeButton)

      // Add image via mock widget
      const widgetBtn = screen.getByTestId('cloudinary-widget')
      await user.click(widgetBtn)

      // Submit
      await user.click(screen.getByRole('button', { name: /submitCreate/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/products',
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    it('shows validation error when name is empty and form is submitted', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      // Add price, size, and image but no name
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10.00', valueAsNumber: 10.00 } })
      const sizeButton = screen.getByRole('button', { name: /^M$/i })
      await user.click(sizeButton)
      const widgetBtn = screen.getByTestId('cloudinary-widget')
      await user.click(widgetBtn)

      await user.click(screen.getByRole('button', { name: /submitCreate/i }))

      // Validation should prevent fetch from being called
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled()
      })
    })

    it('shows error when images are missing', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      await user.type(screen.getByLabelText(/^name$/i), 'Test Product')
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '50.00', valueAsNumber: 50.00 } })
      const sizeButton = screen.getByRole('button', { name: /^M$/i })
      await user.click(sizeButton)

      // No image added

      await user.click(screen.getByRole('button', { name: /submitCreate/i }))

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('Edit mode', () => {
    const initialData = {
      id: 'p1',
      name: 'Test Product',
      price: 50,
      category: 'CLOTHES' as const,
      sizes: ['M'],
      images: ['https://res.cloudinary.com/test/image.jpg'],
      active: true,
      description: 'A great product',
    }

    it('pre-fills form with initialData', () => {
      render(<ProductForm initialData={initialData} />)
      const nameInput = screen.getByLabelText(/^name$/i) as HTMLInputElement
      expect(nameInput.value).toBe('Test Product')
    })

    it('shows the edit submit button text', () => {
      render(<ProductForm initialData={initialData} />)
      expect(screen.getByRole('button', { name: /submitEdit/i })).toBeInTheDocument()
    })

    it('submits PUT to /api/products/p1 on save', async () => {
      const user = userEvent.setup()
      render(<ProductForm initialData={initialData} />)

      await user.click(screen.getByRole('button', { name: /submitEdit/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/products/p1',
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('redirects to /admin after successful save', async () => {
      const user = userEvent.setup()
      render(<ProductForm initialData={initialData} />)

      await user.click(screen.getByRole('button', { name: /submitEdit/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('shows server error message when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      })

      const user = userEvent.setup()
      render(<ProductForm initialData={initialData} />)

      await user.click(screen.getByRole('button', { name: /submitEdit/i }))

      await waitFor(() => {
        expect(screen.getByText(/serverError/i)).toBeInTheDocument()
      })
    })
  })

  describe('Sizes toggle', () => {
    it('toggles size selection on click', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      const sizeM = screen.getByRole('button', { name: /^M$/i })
      await user.click(sizeM)
      // After click, M should be selected (default variant)
      expect(sizeM).toHaveAttribute('data-selected', 'true')

      await user.click(sizeM)
      // After second click, M should be deselected
      expect(sizeM).not.toHaveAttribute('data-selected', 'true')
    })
  })

  describe('Image management', () => {
    it('adds image URL when CloudinaryWidget triggers onUpload', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      const widgetBtn = screen.getByTestId('cloudinary-widget')
      await user.click(widgetBtn)

      // Image preview should appear with the uploaded URL
      const img = screen.getByAltText(/image-1/i)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/test/image.jpg')
    })

    it('removes image when × button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProductForm />)

      // Add an image
      await user.click(screen.getByTestId('cloudinary-widget'))
      expect(screen.getByAltText(/image-1/i)).toBeInTheDocument()

      // Remove it
      const removeBtn = screen.getByRole('button', { name: /removeImage/i })
      await user.click(removeBtn)

      expect(screen.queryByAltText(/image-1/i)).not.toBeInTheDocument()
    })
  })
})
