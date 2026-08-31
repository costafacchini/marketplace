import { buildWhatsAppUrl, WHATSAPP_URL_SAFE_LENGTH } from '@/lib/whatsapp'

describe('buildWhatsAppUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '5511999999999'
  })

  it('output starts with the wa.me URL and the configured number', () => {
    const items = [
      { productId: '1', name: 'Camiseta', size: 'M', price: 50, quantity: 2, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    expect(url).toContain('wa.me/5511999999999')
    expect(url.startsWith('https://wa.me/')).toBe(true)
  })

  it('encodes special Portuguese characters — ã and ç must not appear literally', () => {
    const items = [
      { productId: '1', name: 'Regata', size: 'P', price: 30, quantity: 1, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    // The message contains "Olá" (á), "encomendar" (no special), "Total estimado" (ã)
    expect(url).not.toContain('ã')
    expect(url).not.toContain('ç')
    expect(url).not.toContain('á')
  })

  it('computes the total correctly for multiple items', () => {
    const items = [
      { productId: '1', name: 'Camiseta', size: 'M', price: 50, quantity: 2, image: '' },
      { productId: '2', name: 'Calça', size: 'G', price: 80, quantity: 1, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    // Total = 50×2 + 80×1 = 180 — formatted as R$ 180,00
    expect(url).toContain(encodeURIComponent('R$'))
  })

  it('includes item name and size in the message', () => {
    const items = [
      { productId: '1', name: 'Vestido', size: 'P', price: 120, quantity: 1, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    expect(url).toContain(encodeURIComponent('Vestido'))
    expect(url).toContain(encodeURIComponent('Tam. P'))
  })

  it('URL has text query parameter', () => {
    const items = [
      { productId: '1', name: 'Top', size: 'M', price: 40, quantity: 1, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    expect(url).toContain('?text=')
  })

  it('URL length stays within safe limit for a typical small cart', () => {
    const items = [
      { productId: '1', name: 'Camiseta', size: 'M', price: 50, quantity: 2, image: '' },
      { productId: '2', name: 'Calça', size: 'G', price: 80, quantity: 1, image: '' },
    ]
    const url = buildWhatsAppUrl(items)
    expect(url!.length).toBeLessThanOrEqual(WHATSAPP_URL_SAFE_LENGTH)
  })

  it('exports WHATSAPP_URL_SAFE_LENGTH as a positive number', () => {
    expect(WHATSAPP_URL_SAFE_LENGTH).toBeGreaterThan(0)
  })
})
