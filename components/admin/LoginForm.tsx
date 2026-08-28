'use client'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CREDENTIALS_SIGNIN_ERROR = 'CredentialsSignin'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    await signIn('credentials', {
      email: values.email,
      password: values.password,
      callbackUrl: '/admin',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('admin.login.title')}</h1>

      {error === CREDENTIALS_SIGNIN_ERROR && (
        <p role="alert" className="text-sm text-destructive">
          {t('admin.login.invalidCredentials')}
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">{t('admin.login.email')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...field}
            />
          )}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">{t('admin.login.password')}</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...field}
            />
          )}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('admin.login.submitting') : t('admin.login.submit')}
      </Button>
    </form>
  )
}
