'use client'

import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'

interface ActiveToggleProps {
  id: string
  active: boolean
}

export function ActiveToggle({ id, active }: ActiveToggleProps) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
  }

  return <Switch checked={active} onCheckedChange={toggle} />
}
