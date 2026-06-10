import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import type { Listing } from '@/lib/db/types'
import type { Session } from 'next-auth'

type RouteContext = { params: Promise<{ id: string }> }

type Platform = 'facebook' | 'instagram'
type Tone = 'casual' | 'professional' | 'urgent'

interface RequestBody {
  platform?: Platform
  tone?: Tone
}

interface SocialPost {
  body: string
  hashtags: string[]
  cta: string
}

function canAccess(listing: Listing, session: Session | null): boolean {
  const user = session?.user as { agencyId?: string; personalUserId?: string } | undefined
  if (user?.agencyId && listing.agency_id === user.agencyId) return true
  if (user?.personalUserId && listing.user_id === user.personalUserId) return true
  return false
}

async function isAgencyRateLimited(agencyId: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10)
    const key = `ai_rl:social:${agencyId}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 100
  } catch {
    return false
  }
}

function buildPropertyDescription(l: Listing): string {
  return [
    l.ai_title || l.title,
    l.ai_tagline,
    l.street && `כתובת: ${[l.street, l.neighborhood, l.city].filter(Boolean).join(', ')}`,
    l.rooms && `חדרים: ${l.rooms}`,
    l.built_area && `שטח: ${l.built_area} מ"ר`,
    l.floor && `קומה: ${l.floor}${l.total_floors ? ` מתוך ${l.total_floors}` : ''}`,
    l.price && !l.price_on_request && `מחיר: ₪${l.price.toLocaleString('he-IL')}`,
    l.price_on_request && 'מחיר לפי פנייה',
    l.ai_story && `סיפור: ${l.ai_story.slice(0, 600)}`,
    l.ai_highlights?.length && `נקודות בולטות: ${l.ai_highlights.slice(0, 5).join(' · ')}`,
  ].filter(Boolean).join('\n')
}

const TONE_GUIDE: Record<Tone, string> = {
  casual: 'טון חברי, חם, נגיש. כמו לספר על משהו מגניב לחבר.',
  professional: 'טון מקצועי, אמין, מהוקצע. דגש על איכות, מיקום וערך השקעה.',
  urgent: 'טון של "אל תפספסו". הדגש מוגבל בזמן, ביקוש גבוה, וקריאה מיידית לפעולה.',
}

const PLATFORM_GUIDE: Record<Platform, string> = {
  facebook: `פוסט לפייסבוק: 2-3 פסקאות קצרות (סה"כ עד 150 מילים).
שורה ראשונה חזקה כדי לעצור גלילה. שילוב מינימלי של אימוג'ים (3-5 בסך הכל).
הוסף קריאה ברורה לפעולה בסוף ("פנו אלי בפרטי", "הקישור בתגובות", וכו').`,
  instagram: `פוסט לאינסטגרם: קצר ומכוון לחזותי (עד 90 מילים).
שורה ראשונה מושכת תשומת לב. הרבה אימוג'ים רלוונטיים (5-8) משולבים בטקסט.
סגנון "סטוריטלינג" קצר, כאילו מתארים את הדירה כסיפור.
אל תכלול קריאה לפעולה בגוף — היא בכפתור "Link in bio".`,
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccess(listing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as RequestBody
  const platform: Platform = body.platform === 'instagram' ? 'instagram' : 'facebook'
  const tone: Tone = body.tone === 'professional' || body.tone === 'urgent' ? body.tone : 'casual'

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI לא הוגדר במערכת' }, { status: 500 })
  }

  if (await isAgencyRateLimited(session.user.agencyId)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית ליצירת פוסטים' }, { status: 429 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const propertyDesc = buildPropertyDescription(listing)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `אתה קופירייטר נדל"ן בכיר שכותב פוסטים ברשתות חברתיות עבור סוכנים ישראלים.
כותב בעברית טבעית ושוטפת. אל תשתמש במילים גנריות ("מדהים", "חלום") — תיאור ספציפי תמיד מנצח.`,
      messages: [
        {
          role: 'user',
          content: `כתוב פוסט שיווקי עבור הנכס הבא.

פלטפורמה: ${platform === 'facebook' ? 'Facebook' : 'Instagram'}
${PLATFORM_GUIDE[platform]}

טון: ${tone}
${TONE_GUIDE[tone]}

החזר JSON בלבד (ללא markdown ללא הסברים) במבנה:
{
  "body": "טקסט הפוסט המלא, כולל מעברי שורה במידת הצורך",
  "hashtags": ["#hashtag1", "#hashtag2", "..."],
  "cta": "שורת קריאה לפעולה קצרה אחת"
}

הנחיות hashtags:
- ${platform === 'instagram' ? '10-15 hashtags' : '5-7 hashtags'}
- מילים בעברית בלבד (לא תרגיל אנגלי)
- מערב בין כלליים (#נדלן #למכירה) לספציפיים לעיר/שכונה/סוג נכס

פרטי הנכס:
${propertyDesc}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AI לא החזיר טקסט' }, { status: 500 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content.text)
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'JSON לא תקין מה-AI' }, { status: 500 })
      try {
        parsed = JSON.parse(match[0])
      } catch {
        return NextResponse.json({ error: 'JSON לא תקין מה-AI' }, { status: 500 })
      }
    }

    const result = parsed as Partial<SocialPost>
    if (typeof result.body !== 'string' || !Array.isArray(result.hashtags)) {
      return NextResponse.json({ error: 'מבנה תוצאה לא צפוי' }, { status: 500 })
    }

    return NextResponse.json({
      body: result.body.trim(),
      hashtags: result.hashtags.filter(h => typeof h === 'string').slice(0, 15),
      cta: typeof result.cta === 'string' ? result.cta.trim() : '',
      platform,
      tone,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[social-post] Anthropic error:', { msg })
    return NextResponse.json({ error: 'יצירת הפוסט נכשלה' }, { status: 500 })
  }
}
