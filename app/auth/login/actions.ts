'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard'

  if (!email || !password) {
    redirect(`/auth/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  try {
    await signIn('agent-credentials', { email, password, redirectTo: callbackUrl })
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/auth/login?error=${err.type}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
    // NEXT_REDIRECT — let Next.js handle it
    throw err
  }
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  const callbackUrl = (formData.get('callbackUrl') as string) || '/personal'
  await signIn('google', { redirectTo: callbackUrl })
}
