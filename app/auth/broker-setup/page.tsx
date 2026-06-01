import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import BrokerSetupForm from './_form'

export const dynamic = 'force-dynamic'

export default async function BrokerSetupPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/auth/login?mode=commercial')
  }

  const user = session.user as unknown as Record<string, unknown>

  // Already a commercial user — go straight to dashboard
  if (user.userType === 'commercial' && user.agencyId) {
    redirect('/dashboard')
  }

  return (
    <BrokerSetupForm
      name={session.user.name ?? ''}
      email={session.user.email}
    />
  )
}
