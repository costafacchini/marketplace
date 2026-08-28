'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface SignOutButtonProps {
  label: string
}

export function SignOutButton({ label }: SignOutButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      {label}
    </Button>
  )
}
