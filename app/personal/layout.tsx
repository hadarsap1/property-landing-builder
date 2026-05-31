import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import Link from 'next/link'

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.personalUserId) {
    redirect('/auth/login?callbackUrl=/personal')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-14 flex items-center px-4 gap-4">
        <Link href="/personal" className="font-bold text-gray-900 text-base shrink-0">
          PropBuilder
        </Link>

        <div className="mr-auto flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[180px]">
            {session.user?.email ?? 'אורח'}
          </span>
          {session.user?.email ? (
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                יציאה
              </button>
            </form>
          ) : (
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
              התחברות
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
