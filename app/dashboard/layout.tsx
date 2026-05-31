import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import { signOut } from '@/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-gray-900">
            דשבורד
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user?.email}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/auth/login' })
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                יציאה
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
