'use server'

import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { getAgentByInviteToken, acceptInvitation } from '@/lib/db/queries/agents'

export async function setPasswordAction(formData: FormData): Promise<void> {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!token) redirect('/auth/login')

  if (!password || password.length < 8) {
    redirect(`/auth/set-password?token=${token}&error=short`)
  }
  if (password !== confirm) {
    redirect(`/auth/set-password?token=${token}&error=mismatch`)
  }

  const agent = await getAgentByInviteToken(token)
  if (!agent) {
    redirect(`/auth/set-password?token=${token}&error=expired`)
  }

  await acceptInvitation(agent.id, password)

  // Sign in automatically with the new password
  try {
    await signIn('agent-credentials', {
      email: agent.email,
      password,
      redirectTo: '/dashboard',
    })
  } catch (err) {
    if (err instanceof AuthError) {
      redirect('/auth/login')
    }
    throw err // NEXT_REDIRECT
  }
}
