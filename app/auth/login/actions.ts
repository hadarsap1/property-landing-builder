'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { after } from 'next/server'

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
    throw err
  }
}

function logToDb(stage: string, payload: unknown) {
  const data = JSON.stringify({ stage, payload, ts: new Date().toISOString() })
  const write = async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS auth_debug_log (
        id SERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT NOW(), data TEXT
      )
    `.catch(() => {})
    await sql`INSERT INTO auth_debug_log (data) VALUES (${data})`.catch(() => {})
  }
  try { after(write) } catch { write().catch(() => {}) }
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  const callbackUrl = (formData.get('callbackUrl') as string) || '/personal'

  logToDb('googleSignInAction:start', { callbackUrl })

  let returnedUrl: string | undefined
  try {
    // Use redirect:false so signIn returns the URL instead of calling redirect()
    // internally — that way we can SEE what URL it would have redirected to
    const result = await signIn('google', { redirectTo: callbackUrl, redirect: false })
    returnedUrl = typeof result === 'string' ? result : undefined
    logToDb('googleSignInAction:signIn returned', { result, returnedUrl })
  } catch (err) {
    const e = err as Error & { code?: string; cause?: unknown }
    logToDb('googleSignInAction:signIn threw', {
      name: e?.name,
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split('\n').slice(0, 8).join('\n'),
      cause_name: (e?.cause as Error)?.name,
      cause_message: (e?.cause as Error)?.message,
    })
    throw err
  }

  if (returnedUrl) {
    // redirect() throws NEXT_REDIRECT — must be called outside try/catch
    redirect(returnedUrl)
  }

  logToDb('googleSignInAction:no URL returned, falling back to /auth/error', {})
  redirect('/auth/error?error=NoRedirectUrl')
}
