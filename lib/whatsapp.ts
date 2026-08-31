import { CartItem } from '@/store/cart'
import { formatPrice } from '@/lib/format'

export const WHATSAPP_URL_SAFE_LENGTH = 2000

export function buildWhatsAppUrl(items: CartItem[]): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!number) return null

  const lines = items.map(
    (i) =>
      `- ${i.name} Tam. ${i.size} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`
  )
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const message = [
    'Olá! Gostaria de encomendar:',
    '',
    ...lines,
    '',
    `Total estimado: ${formatPrice(total)}`,
  ].join('\n')

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
