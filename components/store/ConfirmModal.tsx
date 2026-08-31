'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CartItem, useCartStore } from '@/store/cart'
import { buildWhatsAppUrl, WHATSAPP_URL_SAFE_LENGTH } from '@/lib/whatsapp'
import { formatPrice } from '@/lib/format'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
}

export function ConfirmModal({ open, onClose, items }: ConfirmModalProps) {
  const tModal = useTranslations('store.cart.modal')
  const tCart = useTranslations('store.cart')
  const clear = useCartStore((state) => state.clear)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [sent, setSent] = useState(false)

  const url = buildWhatsAppUrl(items)
  const urlTooLong = url !== null && url.length > WHATSAPP_URL_SAFE_LENGTH
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const rawSellerName = process.env.NEXT_PUBLIC_SELLER_NAME
  const sellerName = rawSellerName || tModal('defaultSeller')
  const sellerSubject = rawSellerName || tModal('defaultSellerSubject')

  function handleSend() {
    setError(null)
    if (!url) {
      setError(tModal('configError'))
      return
    }
    const tab = window.open(url, '_blank')
    if (!tab) {
      setBlocked(true)
      return
    }
    clear()
    setSent(true)
  }

  function handleClose() {
    setSent(false)
    setError(null)
    setBlocked(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent>
        {sent ? (
          <>
            <div className="flex justify-center pt-2">
              <div className="size-14 rounded-full bg-primary flex items-center justify-center motion-safe:animate-[check-pop_0.4s_ease-out]">
                <Check className="size-7 text-primary-foreground" aria-hidden />
              </div>
            </div>
            <DialogHeader className="text-center">
              <DialogTitle>{tModal('sentTitle')}</DialogTitle>
              <DialogDescription>{tModal('sentDescription', { sellerSubject })}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-full min-h-[44px]" onClick={handleClose}>{tModal('close')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{tModal('title')}</DialogTitle>
              <DialogDescription>{tModal('description', { sellerName })}</DialogDescription>
            </DialogHeader>

            <div
              className="rounded-md border bg-muted/50 p-3 text-sm space-y-1 max-h-48 overflow-y-auto"
              aria-label={tModal('orderPreviewLabel')}
            >
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="text-foreground">
                    {item.name}{' '}
                    <span className="text-muted-foreground">
                      {tCart('size')} {item.size} {tModal('qtyMultiplier')} {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 mt-1 font-semibold">
                <span>{tModal('orderTotal')}</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>

            {urlTooLong && (
              <p role="alert" className="text-sm text-destructive">
                {tModal('urlTooLarge')}
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {blocked && url && (
              <p role="alert" className="text-sm text-destructive">
                {tModal('blockedError')}{' '}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  {tModal('blockedFallback')}
                </a>
              </p>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="ghost" onClick={handleClose} className="text-muted-foreground min-h-[44px]">
                {tModal('back')}
              </Button>
              <Button onClick={handleSend} disabled={!url || urlTooLong || blocked} className="min-h-[44px]">
                {tModal('send')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
