'use client'

import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'

interface Props {
  id: string
  active: boolean
}

export function ActivePriceListToggle({ id, active }: Props) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/price-lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
  }

  return <Switch checked={active} onCheckedChange={toggle} />
}
