import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import Link from 'next/link'

const ADMIN_NAV = [
  { href: '/admin',                     label: 'סקירה',         icon: '📊' },
  { href: '/admin/agencies',            label: 'סוכנויות',      icon: '🏢' },
  { href: '/admin/personal-users',      label: 'משתמשים פרטיים', icon: '👤' },
  { href: '/admin/listings',            label: 'נכסים',          icon: '🏠' },
  { href: '/admin/billing',             label: 'מנויים',         icon: '💳' },
  { href: '/admin/discount-codes',      label: 'קודי הנחה',      icon: '🏷️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const adminEmail = process.env.SUPER_ADMIN_EMAIL

  if (!adminEmail || session?.user?.email !== adminEmail) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col" dir="rtl">
      <header className="bg-gray-800 border-b border-gray-700 h-14 flex items-center px-4 gap-4">
        <span className="font-bold text-white text-base">⚡ Admin</span>

        <nav className="flex gap-1 mr-4">
          {ADMIN_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white whitespace-nowrap transition-colors"
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">{session.user?.email}</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button type="submit" className="text-xs text-gray-400 hover:text-white transition-colors">
              יציאה
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
