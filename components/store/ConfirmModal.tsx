'use client'

import { useTranslations } from 'next-intl'
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
import { buildWhatsAppUrl } from '@/lib/whatsapp'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
}

export function ConfirmModal({ open, onClose, items }: ConfirmModalProps) {
  const t = useTranslations('store.cart.modal')
  const clear = useCartStore((state) => state.clear)

  function handleSend() {
    const url = buildWhatsAppUrl(items)
    window.open(url, '_blank')
    clear()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            {t('back')}
          </Button>
          <Button onClick={handleSend}>
            {t('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
