import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { createAgentWithPassword, getAgentByEmail } from '@/lib/db/queries/agents'
import { createListing, getListingsByAgency, updateListing } from '@/lib/db/queries/listings'
import { setManualOverride, upsertSubscription } from '@/lib/billing/access'
import type { Listing } from '@/lib/db/types'

const DEMO_EMAIL = 'demo@propbuilder.dev'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'DemoPass2026!'
const DEMO_AGENCY_NAME = 'נדל"ן דמו'

interface SampleListing {
  title: string
  ai_title: string
  ai_tagline: string
  ai_story: string
  street: string
  city: string
  neighborhood: string
  rooms: number
  price: number
  built_area: number
  hero_image_url: string
  chat_qa: string
}

const SAMPLE_LISTINGS: SampleListing[] = [
  {
    title: 'דירת 4 חדרים מרווחת בלב תל אביב',
    ai_title: 'דירה מעוצבת בלב הרוטשילד עם נוף לעיר',
    ai_tagline: 'אור, מרחב והכל במרחק הליכה',
    ai_story: 'דירה מהפנטת בקומה 5 עם מרפסת שמש פתוחה, מטבח שף חדש ומיקום מנצח רגע מרוטשילד. מתאימה למשפחה צעירה או למשקיע שמחפש נכס נכון.',
    street: 'דיזנגוף 100',
    city: 'תל אביב',
    neighborhood: 'מרכז העיר',
    rooms: 4,
    price: 4_200_000,
    built_area: 110,
    hero_image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
    chat_qa: `• ארנונה חודשית: כ-520 ₪
• ועד בית: 320 ₪ (כולל ניקיון, לובי ותחזוקת מעלית)
• 4 דקות הליכה לרכבת הקלה — תחנת אלנבי
• בית ספר יסודי "בלפור" — 6 דק' הליכה
• הבניין משנת 1995, עבר חיזוק תמ"א 38 ב-2019
• ממ"ד דירתי, מעלית שבת, חניה תת-קרקעית אחת
• מותר להחזיק חיות מחמד
• מרפסת שמש 12 מ"ר עם נוף לרוטשילד`,
  },
  {
    title: 'פנטהאוז עם מרפסת ענקית',
    ai_title: 'פנטהאוז מפואר עם נוף 360 במגדל הצפון',
    ai_tagline: 'הקומה האחרונה. הסטנדרט הראשון.',
    ai_story: 'פנטהאוז מרהיב עם מרפסת ענקית של 80 מ״ר, ג׳קוזי חיצוני ונוף פתוח לים ולעיר. הדירה עברה שיפוץ יוקרתי לאחרונה וכוללת מערכת חכמה ופרקט אלון איכותי.',
    street: 'בן יהודה 250',
    city: 'תל אביב',
    neighborhood: 'צפון הישן',
    rooms: 5,
    price: 8_900_000,
    built_area: 160,
    hero_image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80',
    chat_qa: `• ארנונה חודשית: כ-1,150 ₪
• ועד בית: 850 ₪ (כולל קונסיירז' 24/7, חדר כושר, בריכה)
• המגדל משנת 2018, סטנדרט גבוה במיוחד
• 2 חניות תת-קרקעיות + מחסן 6 מ"ר
• מרפסת 80 מ"ר עם ג'קוזי וגריל גז
• מערכת חכמה — דימר, וילונות חשמליים, אינטרקום וידאו
• 7 דק' הליכה לתחנת רכבת ההגנה
• בריכה משותפת על הגג + מועדון דיירים
• מותר חיות מחמד עד 15 ק"ג`,
  },
  {
    title: 'בית פרטי עם גינה ברעננה',
    ai_title: 'וילה משפחתית עם גינה פרטית בלב רעננה',
    ai_tagline: 'בית. גינה. שקט. מושלם למשפחה.',
    ai_story: 'וילה בת שתי קומות עם גינה מטופחת של 200 מ״ר, מטבח גדול, ממ״ד ושני חדרי רחצה מפנקים. במרכז שקט ומרכזי, קרוב למוסדות החינוך הטובים ביותר באזור.',
    street: 'אחוזה 45',
    city: 'רעננה',
    neighborhood: 'מרכז',
    rooms: 6,
    price: 7_500_000,
    built_area: 220,
    hero_image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
    chat_qa: `• ארנונה חודשית: כ-980 ₪
• אין ועד בית — בית פרטי
• גינה פרטית 200 מ"ר עם דשא, פינת ישיבה ומתקני ילדים
• הבית נבנה ב-2005, שופץ ב-2021 (מטבח, אמבטיות, פרקט)
• 2 חניות בחצר הקדמית + מקום ל-2 רכבים נוספים ברחוב
• ממ"ד קומתי, מערכת מיזוג מרכזית, דוד שמש
• בית ספר יסודי "אילן רמון" — 4 דק' נסיעה
• 5 דק' לפארק רעננה הגדול
• מותר חיות מחמד — יש כלב ביתי כרגע`,
  },
]

interface SeedLead {
  name: string
  phone: string
  email: string | null
  source: 'booking' | 'open_house' | 'whatsapp' | 'direct'
  status: 'new' | 'contacted' | 'visited' | 'serious' | 'irrelevant' | 'offer_made' | 'closed'
  listing_idx: number | null  // null = candidate buyer
  budget?: number
  rooms_min?: number
  rooms_max?: number
  desired_areas?: string
  note?: string
  follow_up_days_from_now?: number
}

const SEED_LEADS: SeedLead[] = [
  { name: 'דני כהן',       phone: '0501234567', email: 'danny.c@example.com',  source: 'booking',    status: 'new',        listing_idx: 0 },
  { name: 'רננה לוי',       phone: '0527654321', email: 'renana@example.com',   source: 'whatsapp',   status: 'contacted',  listing_idx: 0, note: 'מעוניינת לקבוע ביקור בסוף השבוע', follow_up_days_from_now: -2 },
  { name: 'אבי מזרחי',      phone: '0541112233', email: null,                   source: 'open_house', status: 'visited',    listing_idx: 1, note: 'הגיע לבית פתוח, אהב את המרפסת' },
  { name: 'שירה אברהמי',    phone: '0509988776', email: 'shira.a@example.com',  source: 'direct',     status: 'serious',    listing_idx: 1, note: 'שולחת חוות דעת לבעל בשבוע הבא', follow_up_days_from_now: 3 },
  { name: 'תומר רביב',      phone: '0503344556', email: 'tomer.r@example.com',  source: 'whatsapp',   status: 'offer_made', listing_idx: 2, note: 'הציע 7.2M — אמרנו ניחזור היום' },
  { name: 'נועה גרין',      phone: '0545667788', email: 'noa.g@example.com',    source: 'booking',    status: 'contacted',  listing_idx: 2, follow_up_days_from_now: 1 },
  { name: 'מאיה שטרן',      phone: '0521122334', email: 'maya.s@example.com',   source: 'booking',    status: 'new',        listing_idx: 0 },
  { name: 'יוסי עמר',       phone: '0507788990', email: null,                   source: 'direct',     status: 'irrelevant', listing_idx: 1, note: 'תקציב לא מתאים' },
  { name: 'גלית פז',        phone: '0506677889', email: 'galit.p@example.com',  source: 'direct',     status: 'new',        listing_idx: null, budget: 5_000_000, rooms_min: 4, rooms_max: 5, desired_areas: 'תל אביב, רמת גן' },
  { name: 'אסף הראל',       phone: '0524455667', email: 'asaf.h@example.com',   source: 'direct',     status: 'contacted',  listing_idx: null, budget: 8_000_000, rooms_min: 5, rooms_max: 6, desired_areas: 'רעננה, הרצליה, כפר סבא', note: 'מחפש בית עם גינה — שלחנו את אחוזה 45' },
]

interface SeedVisit {
  listing_idx: number
  lead_idx: number | null
  hours_from_now: number  // negative = past
  duration_minutes: number
  visit_type: 'buyer' | 'seller'
  visitor_name: string
  visitor_phone: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
}

const SEED_VISITS: SeedVisit[] = [
  { listing_idx: 0, lead_idx: 1,    hours_from_now: -72,  duration_minutes: 45, visit_type: 'buyer', visitor_name: 'רננה לוי', visitor_phone: '0527654321', status: 'completed', notes: 'נראה מעוניינת מאוד — מבקשת חוזה ראשון' },
  { listing_idx: 1, lead_idx: 2,    hours_from_now: -120, duration_minutes: 60, visit_type: 'buyer', visitor_name: 'אבי מזרחי', visitor_phone: '0541112233', status: 'completed' },
  { listing_idx: 0, lead_idx: 6,    hours_from_now: 18,   duration_minutes: 45, visit_type: 'buyer', visitor_name: 'מאיה שטרן', visitor_phone: '0521122334', status: 'scheduled' },
  { listing_idx: 1, lead_idx: 3,    hours_from_now: 42,   duration_minutes: 60, visit_type: 'buyer', visitor_name: 'שירה אברהמי + בעל', visitor_phone: '0509988776', status: 'scheduled', notes: 'מגיעים עם אדריכלית' },
  { listing_idx: 2, lead_idx: 4,    hours_from_now: 66,   duration_minutes: 45, visit_type: 'buyer', visitor_name: 'תומר רביב', visitor_phone: '0503344556', status: 'scheduled', notes: 'ביקור שני — סגירת עסקה' },
  { listing_idx: 2, lead_idx: null, hours_from_now: 90,   duration_minutes: 30, visit_type: 'seller', visitor_name: 'בעל הנכס — אורי כהן', visitor_phone: '0507778899', status: 'scheduled', notes: 'חתימת מסמכים והעברת מפתח' },
  { listing_idx: 0, lead_idx: 0,    hours_from_now: 144,  duration_minutes: 45, visit_type: 'buyer', visitor_name: 'דני כהן', visitor_phone: '0501234567', status: 'scheduled' },
  { listing_idx: 2, lead_idx: 5,    hours_from_now: 192,  duration_minutes: 60, visit_type: 'buyer', visitor_name: 'נועה גרין', visitor_phone: '0545667788', status: 'scheduled' },
]

async function clearDemoData(agencyId: string): Promise<void> {
  // Order matters: child rows before parent. lead_notes -> visits -> leads -> analytics
  await sql`DELETE FROM lead_notes WHERE lead_id IN (SELECT id FROM leads WHERE agency_id = ${agencyId})`
  await sql`DELETE FROM property_visits WHERE agency_id = ${agencyId}`
  await sql`DELETE FROM leads WHERE agency_id = ${agencyId}`
  await sql`DELETE FROM analytics_events WHERE agency_id = ${agencyId}`
}

async function ensureListings(agencyId: string, agentId: string, baseSlug: string): Promise<Listing[]> {
  const existing = await getListingsByAgency(agencyId)
  const result: Listing[] = []

  for (let i = 0; i < SAMPLE_LISTINGS.length; i++) {
    const s = SAMPLE_LISTINGS[i]
    const reused = existing[i]
    if (reused) {
      const updated = await updateListing(reused.id, {
        title: s.title,
        ai_title: s.ai_title,
        ai_tagline: s.ai_tagline,
        ai_story: s.ai_story,
        chat_qa: s.chat_qa,
        street: s.street,
        city: s.city,
        neighborhood: s.neighborhood,
        rooms: s.rooms,
        price: s.price,
        built_area: s.built_area,
        hero_image_url: s.hero_image_url,
        status: 'active',
      })
      result.push(updated ?? reused)
    } else {
      const created = await createListing({
        agency_id: agencyId,
        agent_id: agentId,
        slug: `demo-${i + 1}-${baseSlug}`,
        title: s.title,
        ai_title: s.ai_title,
        ai_tagline: s.ai_tagline,
        ai_story: s.ai_story,
        chat_qa: s.chat_qa,
        street: s.street,
        city: s.city,
        neighborhood: s.neighborhood,
        rooms: s.rooms,
        price: s.price,
        built_area: s.built_area,
        hero_image_url: s.hero_image_url,
      })
      result.push(created)
    }
  }
  return result
}

async function seedLeads(agencyId: string, agentId: string, listings: Listing[]): Promise<string[]> {
  const ids: string[] = []
  for (const lead of SEED_LEADS) {
    const listingId = lead.listing_idx !== null ? listings[lead.listing_idx]?.id ?? null : null
    const { rows } = await sql<{ id: string }>`
      INSERT INTO leads
        (listing_id, agency_id, name, phone, email, source, status,
         budget, rooms_min, rooms_max, desired_areas)
      VALUES
        (${listingId}, ${agencyId}, ${lead.name}, ${lead.phone}, ${lead.email},
         ${lead.source}, ${lead.status},
         ${lead.budget ?? null}, ${lead.rooms_min ?? null}, ${lead.rooms_max ?? null},
         ${lead.desired_areas ?? null})
      RETURNING id
    `
    const leadId = rows[0].id
    ids.push(leadId)

    if (lead.note) {
      const followUp = typeof lead.follow_up_days_from_now === 'number'
        ? new Date(Date.now() + lead.follow_up_days_from_now * 24 * 60 * 60 * 1000).toISOString()
        : null
      await sql`
        INSERT INTO lead_notes (lead_id, agent_id, note, follow_up_at)
        VALUES (${leadId}, ${agentId}, ${lead.note}, ${followUp})
      `
    }
  }
  return ids
}

async function seedVisits(agencyId: string, agentId: string, listings: Listing[], leadIds: string[]): Promise<void> {
  for (const v of SEED_VISITS) {
    const listing = listings[v.listing_idx]
    if (!listing) continue
    const leadId = v.lead_idx !== null ? leadIds[v.lead_idx] ?? null : null
    const visitAt = new Date(Date.now() + v.hours_from_now * 60 * 60 * 1000).toISOString()
    await sql`
      INSERT INTO property_visits
        (listing_id, agency_id, agent_id, lead_id, visit_at, duration_minutes,
         visit_type, visitor_name, visitor_phone, notes, status)
      VALUES
        (${listing.id}, ${agencyId}, ${agentId}, ${leadId}, ${visitAt}, ${v.duration_minutes},
         ${v.visit_type}, ${v.visitor_name}, ${v.visitor_phone}, ${v.notes ?? null}, ${v.status})
    `
  }
}

async function seedAnalytics(agencyId: string, listings: Listing[]): Promise<void> {
  // 30 days of synthetic traffic. Earlier days = fewer views (steady growth curve).
  // Per-listing: 3-25 page views/day, 15% whatsapp click rate, 8% phone, 5% booking.
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  type Row = { event_type: string; listing_id: string; session_id: string; created_at: string; utm_source: string | null }
  const rows: Row[] = []
  const utms = ['yad2', 'facebook', 'whatsapp', 'instagram', null, null, null]

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    // Growth: more recent days get more traffic
    const growth = 0.4 + (29 - dayOffset) / 29 * 0.6  // 0.4 → 1.0
    for (let li = 0; li < listings.length; li++) {
      const listing = listings[li]
      // listing 0 = best performer, listing 2 = least
      const popularityMul = li === 0 ? 1.4 : li === 1 ? 1.0 : 0.6
      const baseViews = Math.round((8 + Math.random() * 10) * growth * popularityMul)

      for (let v = 0; v < baseViews; v++) {
        const sessionId = `s${dayOffset}_${li}_${v}_${Math.floor(Math.random() * 1e6)}`
        const ts = new Date(now - dayOffset * DAY - Math.floor(Math.random() * DAY)).toISOString()
        const utm = utms[Math.floor(Math.random() * utms.length)]

        rows.push({ event_type: 'page_view', listing_id: listing.id, session_id: sessionId, created_at: ts, utm_source: utm })

        // Engagement: 15% whatsapp, 8% phone, 5% booking
        const r = Math.random()
        if (r < 0.15) {
          rows.push({ event_type: 'whatsapp_click', listing_id: listing.id, session_id: sessionId, created_at: ts, utm_source: utm })
        } else if (r < 0.23) {
          rows.push({ event_type: 'phone_click', listing_id: listing.id, session_id: sessionId, created_at: ts, utm_source: utm })
        } else if (r < 0.28) {
          rows.push({ event_type: 'booking_click', listing_id: listing.id, session_id: sessionId, created_at: ts, utm_source: utm })
        }
      }
    }
  }

  // Batch insert in chunks of 100 to keep statements small
  const { db } = await import('@/lib/db')
  const CHUNK = 100
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const placeholders = chunk
      .map((_, j) => `($${j * 6 + 1}, $${j * 6 + 2}, $${j * 6 + 3}, $${j * 6 + 4}, $${j * 6 + 5}, $${j * 6 + 6})`)
      .join(', ')
    const values = chunk.flatMap(r => [r.event_type, r.listing_id, agencyId, r.session_id, r.created_at, r.utm_source])
    await db.query(
      `INSERT INTO analytics_events (event_type, listing_id, agency_id, session_id, created_at, utm_source)
       VALUES ${placeholders}`,
      values,
    )
  }
}

export async function POST() {
  const session = await auth()
  if (!process.env.SUPER_ADMIN_EMAIL || session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await ensureSchema()

  // Find or create agency + agent
  let agent = await getAgentByEmail(DEMO_EMAIL)
  let agencyId: string
  let baseSlug: string

  if (agent) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12)
    await sql`UPDATE agents SET password_hash = ${hash} WHERE id = ${agent.id}`
    agencyId = agent.agency_id
    const { rows } = await sql<{ slug: string }>`SELECT slug FROM agencies WHERE id = ${agencyId} LIMIT 1`
    baseSlug = rows[0]?.slug ?? 'demo'
  } else {
    baseSlug = await generateUniqueAgencySlug(DEMO_AGENCY_NAME)
    const agency = await createAgency({
      slug: baseSlug,
      name: DEMO_AGENCY_NAME,
      contact_email: DEMO_EMAIL,
      primary_color: '#2563eb',
    })
    agencyId = agency.id
    await upsertSubscription({ agencyId, status: 'active' })
    await setManualOverride(agencyId, true)
    agent = await createAgentWithPassword({
      agency_id: agencyId,
      name: 'Demo Broker',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: 'admin',
    })
  }

  // Replay demo data so the experience is always fresh
  await clearDemoData(agencyId)
  const listings = await ensureListings(agencyId, agent.id, baseSlug)
  const leadIds = await seedLeads(agencyId, agent.id, listings)
  await seedVisits(agencyId, agent.id, listings, leadIds)
  await seedAnalytics(agencyId, listings)

  return NextResponse.json({
    ok: true,
    agency_id: agencyId,
    agency_slug: baseSlug,
    seeded: {
      listings: listings.length,
      leads: leadIds.length,
      visits: SEED_VISITS.length,
    },
    credentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    login_url: '/auth/login?mode=commercial',
  })
}
