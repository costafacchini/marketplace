import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CloudinaryWidget } from '@/components/admin/CloudinaryWidget'

jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src} alt={props.alt} />
  },
}))

let widgetCallback: ((error: unknown, result: { event: string; info: { secure_url: string } }) => void) | null = null
const mockOpen = jest.fn()
const mockCreateUploadWidget = jest.fn((config, callback) => {
  widgetCallback = callback
  return { open: mockOpen }
})

describe('CloudinaryWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    widgetCallback = null
    ;(window as unknown as Record<string, unknown>).cloudinary = {
      createUploadWidget: mockCreateUploadWidget,
    }
  })

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).cloudinary
  })

  it('renders Add Photos button', () => {
    const onUpload = jest.fn()
    render(<CloudinaryWidget onUpload={onUpload} />)
    expect(screen.getByRole('button', { name: /addPhotos/i })).toBeInTheDocument()
  })

  it('opens the cloudinary widget when button is clicked', () => {
    const onUpload = jest.fn()
    render(<CloudinaryWidget onUpload={onUpload} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockCreateUploadWidget).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledTimes(1)
  })

  it('calls onUpload with secure_url when upload succeeds', () => {
    const onUpload = jest.fn()
    render(<CloudinaryWidget onUpload={onUpload} />)
    // Open widget to create it and register callback
    fireEvent.click(screen.getByRole('button'))

    // Simulate successful upload
    expect(widgetCallback).not.toBeNull()
    widgetCallback!(null, { event: 'success', info: { secure_url: 'https://res.cloudinary.com/test/image.jpg' } })

    expect(onUpload).toHaveBeenCalledWith('https://res.cloudinary.com/test/image.jpg')
  })

  it('does not call onUpload for non-success events', () => {
    const onUpload = jest.fn()
    render(<CloudinaryWidget onUpload={onUpload} />)
    fireEvent.click(screen.getByRole('button'))

    widgetCallback!(null, { event: 'queued', info: { secure_url: 'https://res.cloudinary.com/test/image.jpg' } })

    expect(onUpload).not.toHaveBeenCalled()
  })
})
