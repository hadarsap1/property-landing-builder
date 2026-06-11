import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAgencyById, updateAgency } from '@/lib/db/queries/agencies'

// Valid public hostname: labels of letters/digits/hyphens, at least one dot
const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

/**
 * Best-effort: register the domain on the Vercel project so its edge
 * network serves it. Needs VERCEL_TOKEN + VERCEL_PROJECT_ID env vars;
 * silently skipped otherwise (the domain can be added manually in the
 * Vercel dashboard).
 */
async function registerDomainWithVercel(domain: string): Promise<string | null> {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return null
  try {
    const teamQs = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains${teamQs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })
    if (res.ok) return null
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } }
    // Already attached to this project — fine
    if (body.error?.code === 'domain_already_in_use') return null
    return body.error?.code ?? `vercel_api_${res.status}`
  } catch {
    return 'vercel_api_unreachable'
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const agency = await getAgencyById(session.user.agencyId)
  if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ agency })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = (await req.json()) as Record<string, unknown>
  const allowed = ['name', 'logo_url', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone', 'custom_domain'] as const
  const data = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  ) as Parameters<typeof updateAgency>[1] & { custom_domain?: string | null }

  let domainWarning: string | null = null
  if ('custom_domain' in data) {
    const raw = typeof data.custom_domain === 'string' ? data.custom_domain.trim().toLowerCase() : ''
    if (!raw) {
      data.custom_domain = null
    } else {
      if (!HOSTNAME_RE.test(raw)) {
        return NextResponse.json({ error: 'דומיין לא תקין — לדוגמה: listings.my-agency.co.il' }, { status: 400 })
      }
      if (raw.endsWith(`.${ROOT_DOMAIN}`) || raw === ROOT_DOMAIN) {
        return NextResponse.json({ error: 'לא ניתן להשתמש בדומיין של המערכת' }, { status: 400 })
      }
      data.custom_domain = raw
      domainWarning = await registerDomainWithVercel(raw)
    }
  }

  let agency
  try {
    agency = await updateAgency(session.user.agencyId, data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('custom_domain') && (msg.includes('duplicate') || msg.includes('unique'))) {
      return NextResponse.json({ error: 'הדומיין כבר משויך לסוכנות אחרת' }, { status: 409 })
    }
    throw e
  }
  return NextResponse.json({ agency, ...(domainWarning ? { domainWarning } : {}) })
}
