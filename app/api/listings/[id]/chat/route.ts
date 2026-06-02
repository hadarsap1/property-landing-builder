import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getListingById } from '@/lib/db/queries/listings'
import type { Listing } from '@/lib/db/types'

type RouteContext = { params: Promise<{ id: string }> }

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  message?: string
  history?: ChatMessage[]
}

function buildPropertyContext(l: Listing): string {
  const lines: string[] = []

  const title = l.ai_title || l.title
  if (title) lines.push(`שם הנכס: ${title}`)
  if (l.ai_tagline) lines.push(`תיאור קצר: ${l.ai_tagline}`)

  const addr = [l.street, l.neighborhood, l.city].filter(Boolean).join(', ')
  if (addr) lines.push(`כתובת: ${addr}`)

  const priceLabel = l.price_on_request
    ? 'מחיר לפי פנייה'
    : l.price
    ? `₪${l.price.toLocaleString('he-IL')}`
    : null
  if (priceLabel) lines.push(`מחיר: ${priceLabel}`)

  if (l.rooms) lines.push(`חדרים: ${l.rooms}`)
  if (l.bathrooms) lines.push(`שירותים ואמבטיות: ${l.bathrooms}`)
  if (l.built_area) lines.push(`שטח בנוי: ${l.built_area} מ"ר`)
  if (l.outdoor_area) lines.push(`שטח חיצוני/גינה/מרפסת: ${l.outdoor_area} מ"ר`)

  if (l.floor != null) {
    lines.push(`קומה: ${l.floor}${l.total_floors ? ` מתוך ${l.total_floors}` : ''}`)
  }
  if (l.build_year) lines.push(`שנת בנייה: ${l.build_year}`)
  if (l.renovation_year) lines.push(`שנת שיפוץ: ${l.renovation_year}`)

  if (l.parking_spots) {
    const covered = l.parking_covered ? 'מקורה' : 'חיצונית'
    lines.push(`חניות: ${l.parking_spots} (${covered})`)
  } else {
    lines.push('חניה: אין מידע')
  }

  lines.push(`מחסן: ${l.has_storage ? 'יש' : 'אין'}`)
  lines.push(`ממ"ד: ${l.has_saferoom ? 'יש' : 'אין'}`)
  lines.push(`מעלית: ${l.has_elevator ? 'יש' : 'אין'}`)

  if (l.air_directions?.length) {
    const dirMap: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' }
    lines.push(`כיוון אוויר: ${l.air_directions.map(d => dirMap[d] ?? d).join(', ')}`)
  }

  if (l.furniture) {
    const furnitureMap: Record<string, string> = { none: 'ללא ריהוט', partial: 'ריהוט חלקי', full: 'מרוהטת' }
    lines.push(`ריהוט: ${furnitureMap[l.furniture] ?? l.furniture}`)
  }

  const listingType = l.listing_type === 'rent' ? 'להשכרה' : 'למכירה'
  lines.push(`סוג עסקה: ${listingType}`)

  if (l.ai_story) lines.push(`\nתיאור הנכס:\n${l.ai_story}`)
  if (l.ai_highlights?.length) {
    lines.push(`\nיתרונות בולטים:\n${l.ai_highlights.map(h => `• ${h}`).join('\n')}`)
  }

  return lines.join('\n')
}

async function isIpRateLimited(ip: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10)
    const key = `chat_rl:${ip}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 50
  } catch {
    return false
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing || listing.status === 'paused') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-8) : []

  const propertyContext = buildPropertyContext(listing)
  const systemPrompt = `אתה עוזר AI חכם לדף נכס נדל"ן. תפקידך לענות על שאלות של מבקרים בדף לגבי הנכס.
ענה בעברית בלבד. היה ידידותי, קצר ומדויק.
אם אין לך מידע על נושא מסוים (כמו ארנונה מדויקת), אמור זאת בכנות וציין שניתן לפנות לסוכן לפרטים.
אל תמציא מידע שאינו בפרטי הנכס שניתנו לך.

פרטי הנכס:
${propertyContext}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const messages: Anthropic.MessageParam[] = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : 'מצטער, לא הצלחתי לענות. נסה שוב.'

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'ai_error', reply: 'מצטער, אירעה שגיאה. נסה שוב.' }, { status: 500 })
  }
}
