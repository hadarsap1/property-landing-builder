import { notFound } from 'next/navigation'
import { getSellerTokenWithListing } from '@/lib/db/queries/seller-tokens'
import SellerForm from './_seller-form'

export const dynamic = 'force-dynamic'

// Secret-link page — must never be indexed
export const metadata = { robots: { index: false, follow: false } }

type Props = { params: Promise<{ token: string }> }

export default async function SellerPage({ params }: Props) {
  const { token } = await params
  const result = await getSellerTokenWithListing(token)

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">קישור לא תקף</h1>
          <p className="text-gray-600">הקישור פג תוקף או אינו תקין. בקש מהנציג לשלוח קישור חדש.</p>
        </div>
      </main>
    )
  }

  const { sellerToken, listing } = result
  const title = listing.ai_title ?? listing.title ?? 'נכס'
  const address = [listing.street, listing.city].filter(Boolean).join(', ')
  const expiresAt = sellerToken.expires_at ? new Date(sellerToken.expires_at) : null
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
          {address && <p className="text-sm text-gray-500 mt-0.5">{address}</p>}
          {daysLeft !== null && (
            <p className={`text-xs mt-1 ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
              {daysLeft > 0
                ? `קישור זה תקף עוד ${daysLeft} ימים`
                : 'קישור זה פג תוקף היום'}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <SellerForm token={token} listing={listing} />
      </div>
    </main>
  )
}
