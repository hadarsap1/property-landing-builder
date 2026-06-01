import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 1) return NextResponse.json({ streets: [] })

  try {
    // Search all streets matching the query — no city filter to avoid city-name mismatches
    const url =
      'https://data.gov.il/api/3/action/datastore_search' +
      '?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b' +
      `&q=${encodeURIComponent(q)}` +
      '&limit=30'

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`gov.il ${res.status}`)

    const data = (await res.json()) as {
      result?: { records?: Record<string, string>[] }
    }

    const records = data.result?.records ?? []
    // Deduplicate street names — field name varies across gov.il dataset versions
    const seen = new Set<string>()
    const streets: string[] = []
    for (const r of records) {
      const name = (
        r['street_name'] ?? r['שם_רחוב'] ?? r['STREET_NAME'] ?? r['streetname'] ?? ''
      ).trim()
      if (name && !seen.has(name)) {
        seen.add(name)
        streets.push(name)
      }
    }

    return NextResponse.json({ streets })
  } catch {
    return NextResponse.json({ streets: [] })
  }
}
