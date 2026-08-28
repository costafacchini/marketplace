import { LoginForm } from '@/components/admin/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm p-8 rounded-lg border bg-card shadow-sm">
        <LoginForm />
      </div>
    </div>
  )
}
