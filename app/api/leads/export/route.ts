import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllLeadsByAgency } from '@/lib/db/queries/leads'
import type { Lead } from '@/lib/db/types'

const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  visited: 'ביקר',
  serious: 'רציני',
  irrelevant: 'לא רלוונטי',
  offer_made: 'הצעה',
  closed: 'סגור',
}

const SOURCE_LABELS: Record<Lead['source'], string> = {
  direct: 'טופס',
  booking: 'תיאום',
  open_house: 'בית פתוח',
  whatsapp: 'וואטסאפ',
}

function csvCell(v: string | null | undefined): string {
  const s = v ?? ''
  // Neutralize spreadsheet formula injection, then quote
  const safe = /^[=+\-@\t]/.test(s) ? `'${s}` : s
  return `"${safe.replaceAll('"', '""')}"`
}

// Agent downloads the agency's leads as CSV (respects the same filters as the list)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const leads = await getAllLeadsByAgency(session.user.agencyId, {
    listingId: searchParams.get('listingId') ?? undefined,
    status: (searchParams.get('status') ?? undefined) as Lead['status'] | undefined,
    source: (searchParams.get('source') ?? undefined) as Lead['source'] | undefined,
    search: searchParams.get('q') ?? undefined,
  })

  const header = ['שם', 'טלפון', 'מייל', 'סטטוס', 'מקור', 'נכס', 'נוצר', 'אינטראקציה אחרונה']
  const rows = leads.map((l) =>
    [
      csvCell(l.name),
      csvCell(l.phone),
      csvCell(l.email),
      csvCell(STATUS_LABELS[l.status]),
      csvCell(SOURCE_LABELS[l.source]),
      csvCell(l.listing_title ?? ''),
      csvCell(new Date(l.created_at).toISOString()),
      csvCell(l.last_interaction ? new Date(l.last_interaction).toISOString() : ''),
    ].join(',')
  )

  // BOM so Excel opens the Hebrew UTF-8 correctly
  const csv = '﻿' + [header.map(csvCell).join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
