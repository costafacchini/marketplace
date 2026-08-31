'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  name: string
}

export function ImageGallery({ images, name }: Props) {
  const [selected, setSelected] = useState(0)
  const src = images[selected] ?? '/placeholder-product.png'

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={src}
          alt={name}
          fill
          priority
          sizes="(max-width: 672px) calc(100vw - 2rem), 640px"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={`${name} ${i + 1}`}
              aria-current={i === selected ? 'true' : undefined}
              className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 ${
                i === selected ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
