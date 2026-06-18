import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getSubscription, subscriptionIsActive } from '@/lib/billing/access'
import Link from 'next/link'
import { headers } from 'next/headers'

const INK = '#111'
const CREAM = '#f7f5f2'
const ACCENT = '#c0392b'

const NAV = [
  { href: '/dashboard',           label: 'נכסים',    },
  { href: '/dashboard/leads',     label: 'לידים',    },
  { href: '/dashboard/calendar',  label: 'ביקורים',  },
  { href: '/dashboard/analytics', label: 'אנליטיקס', },
  { href: '/dashboard/team',      label: 'צוות',     },
  { href: '/dashboard/settings',  label: 'הגדרות',   },
  { href: '/dashboard/billing',   label: 'חיוב',     },
  { href: '/dashboard/help',      label: 'עזרה',     },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const agencyId = session.user?.agencyId
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? hdrs.get('x-invoke-path') ?? ''

  if (agencyId) {
    const isBillingPage = pathname.startsWith('/dashboard/billing')
    if (!isBillingPage) {
      try {
        const sub = await getSubscription(agencyId)
        if (!subscriptionIsActive(sub)) redirect('/dashboard/billing')
      } catch { /* fall through */ }
    }
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === ''
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: CREAM }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-20 h-14 flex items-center px-5 gap-4"
        style={{ background: CREAM, borderBottom: `2px solid ${INK}` }}
      >
        <Link
          href="/dashboard"
          className="font-display font-black shrink-0"
          style={{ fontSize: '1.05rem', letterSpacing: '-0.03em', color: INK }}
        >
          Prop<span style={{ color: ACCENT }}>Builder</span>
        </Link>

        {/* Mobile nav */}
        <div className="flex sm:hidden flex-1 min-w-0">
          <nav className="flex gap-1 overflow-x-auto flex-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-md text-sm whitespace-nowrap shrink-0 font-medium transition-colors"
                style={{
                  background: isActive(n.href) ? INK : 'transparent',
                  color: isActive(n.href) ? CREAM : '#666',
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mr-auto flex items-center gap-4">
          <span className="text-sm hidden sm:block truncate max-w-[200px]" style={{ color: '#888' }}>
            {session.user?.email}
          </span>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/auth/login' }) }}>
            <button type="submit" className="text-sm font-medium transition-opacity hover:opacity-60" style={{ color: '#666' }}>
              יציאה
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">

        {/* ── Sidebar (desktop) ── */}
        <aside
          className="hidden sm:flex flex-col w-48 shrink-0 pt-6 pb-4 px-3"
          style={{ borderLeft: `2px solid ${INK}`, background: CREAM }}
        >
          <nav className="flex flex-col gap-0.5 flex-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: isActive(n.href) ? INK : 'transparent',
                  color: isActive(n.href) ? CREAM : '#555',
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/builder"
            className="flex items-center justify-center font-bold text-sm px-4 py-2.5 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: ACCENT, color: '#fff' }}
          >
            + נכס חדש
          </Link>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
