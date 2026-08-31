import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageGallery } from '@/components/store/ImageGallery'

// Mock next/image as a plain <img> — strip Next.js-only props that are not valid HTML attrs
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill: _fill,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    priority: _priority,
    ...rest
  }: {
    src: string
    alt: string
    fill?: boolean
    priority?: boolean
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}))

describe('ImageGallery', () => {
  it('renders the main image with the product name as alt text', () => {
    render(<ImageGallery images={['https://example.com/img1.jpg']} name="Blue Dress" />)
    const imgs = screen.getAllByAltText('Blue Dress')
    expect(imgs.length).toBeGreaterThan(0)
    expect(imgs[0]).toBeInTheDocument()
  })

  it('does not render thumbnail row when only one image is provided', () => {
    render(<ImageGallery images={['https://example.com/img1.jpg']} name="Blue Dress" />)
    // Only the main image — no thumbnail buttons
    const buttons = screen.queryAllByRole('button')
    expect(buttons).toHaveLength(0)
  })

  it('renders thumbnail buttons when multiple images are provided', () => {
    render(
      <ImageGallery
        images={['https://example.com/img1.jpg', 'https://example.com/img2.jpg']}
        name="Blue Dress"
      />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('clicking a thumbnail updates the selected image (border class changes)', () => {
    render(
      <ImageGallery
        images={['https://example.com/img1.jpg', 'https://example.com/img2.jpg']}
        name="Blue Dress"
      />
    )
    const buttons = screen.getAllByRole('button')

    // First thumbnail starts selected (has border-primary class)
    expect(buttons[0].className).toContain('border-primary')
    expect(buttons[1].className).toContain('border-transparent')

    // Click second thumbnail
    fireEvent.click(buttons[1])

    expect(buttons[0].className).toContain('border-transparent')
    expect(buttons[1].className).toContain('border-primary')
  })

  it('falls back to /placeholder-product.png when images array is empty', () => {
    render(<ImageGallery images={[]} name="No Image Product" />)
    const img = screen.getByAltText('No Image Product')
    expect(img).toHaveAttribute('src', '/placeholder-product.png')
  })
})
