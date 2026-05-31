import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard',          label: 'נכסים',    icon: '🏠' },
  { href: '/dashboard/team',     label: 'צוות',     icon: '👥' },
  { href: '/dashboard/settings', label: 'הגדרות',   icon: '⚙️' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-14 flex items-center px-4 gap-4">
        <Link href="/dashboard" className="font-bold text-gray-900 text-base shrink-0">
          PropBuilder
        </Link>

        {/* Mobile nav */}
        <nav className="flex gap-1 sm:hidden overflow-x-auto flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 whitespace-nowrap"
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[180px]">
            {session.user?.email}
          </span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/auth/login' })
            }}
          >
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              יציאה
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">

        {/* ── Sidebar (desktop) ────────────────────────────────── */}
        <aside className="hidden sm:flex flex-col w-52 shrink-0 bg-white border-l border-gray-200 pt-6 pb-4 px-3">
          <nav className="flex flex-col gap-1 flex-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <span className="text-base">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>

          <Link
            href="/builder"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + נכס חדש
          </Link>
        </aside>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
