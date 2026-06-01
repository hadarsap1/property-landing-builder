import { NextRequest, NextResponse } from 'next/server'

// Proxy to data.gov.il streets registry — avoids CORS issues and lets us cache results
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') ?? ''
  const q = searchParams.get('q') ?? ''

  if (!city || q.length < 2) {
    return NextResponse.json({ streets: [] })
  }

  try {
    const filters = JSON.stringify({ city_name: city })
    const url =
      `https://data.gov.il/api/3/action/datastore_search` +
      `?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b` +
      `&filters=${encodeURIComponent(filters)}` +
      `&q=${encodeURIComponent(q)}` +
      `&limit=10`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('upstream error')

    const data = (await res.json()) as {
      result?: { records?: Array<{ street_name?: string; שם_רחוב?: string }> }
    }

    const records = data.result?.records ?? []
    const streets = records
      .map((r) => (r['שם_רחוב'] ?? r.street_name ?? '').trim())
      .filter(Boolean)

    return NextResponse.json({ streets })
  } catch {
    return NextResponse.json({ streets: [] })
  }
}
