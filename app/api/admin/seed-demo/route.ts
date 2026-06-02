import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { createAgentWithPassword, getAgentByEmail } from '@/lib/db/queries/agents'
import { createListing } from '@/lib/db/queries/listings'
import { setManualOverride, upsertSubscription } from '@/lib/billing/access'

const DEMO_EMAIL = 'demo@propbuilder.dev'
const DEMO_PASSWORD = 'DemoPass2026!'
const DEMO_AGENCY_NAME = 'נדל"ן דמו'

export async function POST() {
  const session = await auth()
  if (!process.env.SUPER_ADMIN_EMAIL || session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await ensureSchema()

  // Reuse existing agent if it already exists (idempotent)
  let agent = await getAgentByEmail(DEMO_EMAIL)
  if (agent) {
    // Reset password to the documented one so the credentials stay shareable
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12)
    await sql`UPDATE agents SET password_hash = ${hash} WHERE id = ${agent.id}`
    return NextResponse.json({
      ok: true,
      reset: true,
      agency_id: agent.agency_id,
      credentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      login_url: '/auth/login?mode=commercial',
    })
  }

  // Create agency
  const slug = await generateUniqueAgencySlug(DEMO_AGENCY_NAME)
  const agency = await createAgency({
    slug,
    name: DEMO_AGENCY_NAME,
    contact_email: DEMO_EMAIL,
    primary_color: '#2563eb',
  })

  // Manual-override subscription so it never blocks login
  await upsertSubscription({
    agencyId: agency.id,
    status: 'active',
  })
  await setManualOverride(agency.id, true)

  // Create the admin agent with a known password
  agent = await createAgentWithPassword({
    agency_id: agency.id,
    name: 'Demo Broker',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    role: 'admin',
  })

  // Sample listings
  const samples = [
    {
      title: 'דירת 4 חדרים מרווחת בלב תל אביב',
      street: 'דיזנגוף 100',
      city: 'תל אביב',
      neighborhood: 'מרכז העיר',
      rooms: 4,
      price: 4_200_000,
      built_area: 110,
    },
    {
      title: 'פנטהאוז עם מרפסת ענקית',
      street: 'בן יהודה 250',
      city: 'תל אביב',
      neighborhood: 'צפון הישן',
      rooms: 5,
      price: 8_900_000,
      built_area: 160,
    },
    {
      title: 'בית פרטי עם גינה ברעננה',
      street: 'אחוזה 45',
      city: 'רעננה',
      neighborhood: 'מרכז',
      rooms: 6,
      price: 7_500_000,
      built_area: 220,
    },
  ]

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    await createListing({
      agency_id: agency.id,
      agent_id: agent.id,
      slug: `demo-${i + 1}-${slug}`,
      title: s.title,
      street: s.street,
      city: s.city,
      neighborhood: s.neighborhood,
      rooms: s.rooms,
      price: s.price,
      built_area: s.built_area,
    })
  }

  return NextResponse.json({
    ok: true,
    reset: false,
    agency_id: agency.id,
    agency_slug: slug,
    credentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    login_url: '/auth/login?mode=commercial',
  })
}
