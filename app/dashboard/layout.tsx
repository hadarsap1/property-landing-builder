import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getSubscription, subscriptionIsActive } from '@/lib/billing/access'
import Link from 'next/link'
import { headers } from 'next/headers'

const NAV = [
  { href: '/dashboard',             label: 'נכסים',    icon: '🏠' },
  { href: '/dashboard/leads',       label: 'לידים',    icon: '📬' },
  { href: '/dashboard/calendar',    label: 'ביקורים',  icon: '📅' },
  { href: '/dashboard/analytics',   label: 'אנליטיקס', icon: '📊' },
  { href: '/dashboard/team',        label: 'צוות',     icon: '👥' },
  { href: '/dashboard/settings',    label: 'הגדרות',   icon: '⚙️' },
  { href: '/dashboard/billing',     label: 'חיוב',     icon: '💳' },
  { href: '/dashboard/help',        label: 'עזרה',     icon: '❓' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  // Subscription gate — always allow /dashboard/billing so user can pay
  const agencyId = session.user?.agencyId
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? hdrs.get('x-invoke-path') ?? ''

  if (agencyId) {
    const isBillingPage = pathname.startsWith('/dashboard/billing')
    if (!isBillingPage) {
      const sub = await getSubscription(agencyId)
      if (!subscriptionIsActive(sub)) {
        redirect('/dashboard/billing')
      }
    }
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === ''
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-14 flex items-center px-4 gap-4">
        <Link href="/dashboard" className="font-bold text-gray-900 text-base shrink-0">
          PropBuilder
        </Link>

        {/* Mobile nav — scrollable with fade hint */}
        <div className="flex sm:hidden flex-1 relative min-w-0">
          <nav className="flex gap-1 overflow-x-auto flex-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shrink-0 transition-colors ${
                  isActive(n.href)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          {/* Fade on left edge to hint at more items */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        </div>

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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors font-medium ${
                  isActive(n.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
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
