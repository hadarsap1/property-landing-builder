import nodemailer from 'nodemailer'
import type { WeeklyDigestData } from '@/lib/db/queries/analytics'

export async function sendAdminNotificationEmail({
  subject,
  body,
}: {
  subject: string
  body: string
}): Promise<void> {
  const to = process.env.SUPER_ADMIN_EMAIL
  if (!to) return

  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[admin-notify] ${subject}\n${body}\n`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: body,
  })
}

export async function sendLeadNotificationEmail({
  to,
  leadName,
  leadPhone,
  leadEmail,
  listingTitle,
  listingUrl,
  source,
}: {
  to: string
  leadName: string | null
  leadPhone: string | null
  leadEmail: string | null
  listingTitle: string
  listingUrl: string
  source?: string
}): Promise<void> {
  const isOpenHouse = source === 'open_house'
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[lead-notify] New lead for "${listingTitle}" from ${leadName ?? 'אנונימי'} (${leadPhone ?? leadEmail ?? '—'})`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  const contact = [leadPhone, leadEmail].filter(Boolean).join(' · ') || '—'

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: isOpenHouse ? `הרשמה לבית פתוח: ${listingTitle}` : `ליד חדש: ${listingTitle}`,
    text: `${isOpenHouse ? 'נרשם חדש לבית הפתוח' : 'ליד חדש התקבל'} לנכס "${listingTitle}".\n\nשם: ${leadName ?? '—'}\nיצירת קשר: ${contact}\n\nצפה בלוח הבקרה:\n${listingUrl}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">${isOpenHouse ? '🏠 נרשם חדש לבית הפתוח' : 'ליד חדש התקבל'}</h2>
        <p>נכס: <strong>${listingTitle}</strong></p>
        <table style="border-collapse:collapse;width:100%;margin:12px 0">
          <tr><td style="padding:6px 0;color:#6b7280">שם</td><td style="padding:6px 0;font-weight:600">${leadName ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">יצירת קשר</td><td style="padding:6px 0;font-weight:600">${contact}</td></tr>
        </table>
        <a href="${listingUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          צפה בלידים
        </a>
      </div>
    `,
  })
}

interface SellerMagicLinkOptions {
  to: string
  sellerName: string | null
  listingTitle: string
  sellerUrl: string
}

export async function sendSellerMagicLinkEmail({
  to,
  sellerName,
  listingTitle,
  sellerUrl,
}: SellerMagicLinkOptions): Promise<void> {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[seller-link] Send this link to ${to}:\n${sellerUrl}\n`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  const greeting = sellerName ? `שלום ${sellerName},` : 'שלום,'

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `קישור לעדכון נכס: ${listingTitle}`,
    text: `${greeting}\n\nהנה הקישור שלך לצפייה ועדכון פרטי הנכס:\n${sellerUrl}\n\nהקישור תקף ל-7 ימים.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">עדכון נכס: ${listingTitle}</h2>
        <p>${greeting}<br>הנה הקישור שלך לצפייה ועדכון פרטי הנכס.</p>
        <a href="${sellerUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          צפה בנכס ועדכן פרטים
        </a>
        <p style="color:#6b7280;font-size:13px">הקישור תקף ל-7 ימים.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}): Promise<void> {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[reset-password] Send this link to ${to}:\n${resetUrl}\n`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'איפוס סיסמה — PropBuilder',
    text: `שלום,\n\nקיבלנו בקשה לאיפוס הסיסמה שלך.\n\nלחץ על הקישור לאיפוס:\n${resetUrl}\n\nהקישור תקף לשעה אחת. אם לא ביקשת איפוס, התעלם מהודעה זו.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">איפוס סיסמה</h2>
        <p>שלום,<br>קיבלנו בקשה לאיפוס הסיסמה שלך ב-PropBuilder.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          אפס סיסמה
        </a>
        <p style="color:#6b7280;font-size:13px">הקישור תקף לשעה אחת.<br>אם לא ביקשת איפוס, התעלם מהודעה זו.</p>
      </div>
    `,
  })
}

export async function sendOpenHouseReminderEmail({
  to,
  name,
  listingTitle,
  listingUrl,
  openHouseDate,
  street,
  city,
  agencyName,
}: {
  to: string
  name: string | null
  listingTitle: string
  listingUrl: string
  openHouseDate: Date
  street: string | null
  city: string | null
  agencyName: string
}): Promise<void> {
  const d = new Date(openHouseDate)
  const dateStr = d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const greeting = name ? `שלום ${name},` : 'שלום,'
  const addressParts = [street, city].filter(Boolean)
  const addressDisplay = addressParts.join(', ')
  const subject = `תזכורת: בית פתוח מחר — ${listingTitle}`

  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[open-house-reminder] ${subject} → ${to}`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: `${greeting}\n\nתזכורת: מחר, ${dateStr} בשעה ${timeStr}, יתקיים בית פתוח לנכס "${listingTitle}"${addressDisplay ? ` ב${addressDisplay}` : ''}.\n\nפרטי הנכס: ${listingUrl}\n\nנשמח לראותכם!\n${agencyName}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">🏠 תזכורת לבית פתוח</h2>
        <p>${greeting}</p>
        <p>מחר יתקיים בית פתוח לנכס <strong>${listingTitle}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:12px 0">
          <tr><td style="padding:6px 0;color:#6b7280">תאריך</td><td style="padding:6px 0;font-weight:600">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">שעה</td><td style="padding:6px 0;font-weight:600">${timeStr}</td></tr>
          ${addressDisplay ? `<tr><td style="padding:6px 0;color:#6b7280">כתובת</td><td style="padding:6px 0;font-weight:600">${addressDisplay}</td></tr>` : ''}
        </table>
        <a href="${listingUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          פרטי הנכס
        </a>
        <p style="color:#6b7280;font-size:13px">נשמח לראותכם!<br>${agencyName}</p>
      </div>
    `,
  })
}

function trendHtml(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '<span style="color:#16a34a">▲ חדש</span>' : '<span style="color:#9ca3af">—</span>'
  const pct = Math.round(((current - prev) / prev) * 100)
  if (pct === 0) return '<span style="color:#9ca3af">→ ללא שינוי</span>'
  return pct > 0
    ? `<span style="color:#16a34a">▲ ${pct}%</span>`
    : `<span style="color:#dc2626">▼ ${Math.abs(pct)}%</span>`
}

export async function sendWeeklyDigestEmail({
  to,
  agentName,
  agencyName,
  dashboardUrl,
  data,
  agencyHost,
}: {
  to: string
  agentName: string
  agencyName: string
  dashboardUrl: string
  data: WeeklyDigestData
  agencyHost: string
}): Promise<void> {
  const { currentWeek: c, previousWeek: p, topListings, upcomingOpenHouses } = data

  const todayStr = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  const subject = `דוח שבועי — ${agencyName} | ${todayStr}`

  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[weekly-digest] ${subject} → ${to} | views=${c.views} leads=${c.leads}`)
    return
  }

  const statBox = (label: string, value: number, trend: string) => `
    <td style="text-align:center;padding:12px 8px;background:#f8fafc;border-radius:8px;min-width:80px">
      <div style="font-size:22px;font-weight:700;color:#111827">${value.toLocaleString('he-IL')}</div>
      <div style="font-size:11px;color:#6b7280;margin:2px 0">${label}</div>
      <div style="font-size:11px">${trend}</div>
    </td>`

  const listingRows = topListings.map((l) => {
    const url = `https://${agencyHost}/listings/${l.slug}`
    return `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:13px">
          <a href="${url}" style="color:#2563eb;text-decoration:none">${l.title ?? 'נכס'}</a>
          ${l.city ? `<span style="color:#9ca3af;font-size:11px"> · ${l.city}</span>` : ''}
        </td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px">${l.views}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px">${l.leads}</td>
      </tr>`
  }).join('')

  const openHouseRows = upcomingOpenHouses.map((oh) => {
    const d = new Date(oh.open_house_date)
    const dateStr = d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' })
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    return `
      <li style="padding:4px 0;font-size:13px;color:#374151">
        <strong>${oh.title}</strong>${oh.city ? ` · ${oh.city}` : ''} — ${dateStr} ${timeStr}
      </li>`
  }).join('')

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <h2 style="color:#1e3a5f;margin-bottom:4px">📊 דוח שבועי — ${agencyName}</h2>
      <p style="color:#6b7280;font-size:13px;margin-top:0">7 הימים האחרונים · שלום ${agentName}</p>

      <table style="width:100%;border-spacing:8px;border-collapse:separate;margin:16px 0">
        <tr>
          ${statBox('צפיות',                c.views,           trendHtml(c.views,           p.views))}
          ${statBox('מבקרים ייחודיים',      c.unique_sessions, trendHtml(c.unique_sessions, p.unique_sessions))}
          ${statBox('לחיצות יצירת קשר',    c.contact_clicks,  trendHtml(c.contact_clicks,  p.contact_clicks))}
          ${statBox('לידים חדשים',          c.leads,           trendHtml(c.leads,           p.leads))}
        </tr>
      </table>

      ${topListings.length ? `
      <h3 style="font-size:14px;color:#374151;margin:24px 0 8px">נכסים מובילים השבוע</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="text-align:right;padding:6px 8px;font-size:12px;color:#6b7280;font-weight:600">נכס</th>
            <th style="padding:6px 8px;font-size:12px;color:#6b7280;font-weight:600;text-align:center">צפיות</th>
            <th style="padding:6px 8px;font-size:12px;color:#6b7280;font-weight:600;text-align:center">לידים</th>
          </tr>
        </thead>
        <tbody>${listingRows}</tbody>
      </table>` : ''}

      ${upcomingOpenHouses.length ? `
      <h3 style="font-size:14px;color:#374151;margin:24px 0 8px">בתים פתוחים השבוע</h3>
      <ul style="margin:0;padding:0 16px 0 0;list-style:disc">${openHouseRows}</ul>` : ''}

      <div style="margin:28px 0 16px">
        <a href="${dashboardUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
          לדוח המלא בלוח הבקרה
        </a>
      </div>

      <p style="color:#9ca3af;font-size:11px;border-top:1px solid #f3f4f6;padding-top:12px">
        ${agencyName} · PropBuilder
      </p>
    </div>`

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text: `דוח שבועי — ${agencyName}\n\nצפיות: ${c.views} (${trendHtml(c.views, p.views).replace(/<[^>]+>/g, '')})\nמבקרים: ${c.unique_sessions}\nלחיצות: ${c.contact_clicks}\nלידים: ${c.leads}\n\n${dashboardUrl}`,
  })
}

interface InviteEmailOptions {
  to: string
  agencyName: string
  inviteUrl: string
  inviterName?: string
}

export async function sendInviteEmail({
  to,
  agencyName,
  inviteUrl,
  inviterName,
}: InviteEmailOptions): Promise<void> {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    // Dev / no email configured — log the link so it can be copy-pasted
    console.info(`\n[invite] Send this link to ${to}:\n${inviteUrl}\n`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  const from = process.env.EMAIL_FROM

  const by = inviterName ? ` על ידי ${inviterName}` : ''

  await transport.sendMail({
    from,
    to,
    subject: `הוזמנת להצטרף ל-${agencyName}`,
    text: `שלום,\n\nהוזמנת${by} לצוות ${agencyName}.\n\nלחץ על הקישור להגדרת סיסמה:\n${inviteUrl}\n\nהקישור תקף ל-48 שעות.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">הצטרף ל-${agencyName}</h2>
        <p>שלום,<br>הוזמנת${by} לצוות <strong>${agencyName}</strong>.</p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          הגדר סיסמה
        </a>
        <p style="color:#6b7280;font-size:13px">הקישור תקף ל-48 שעות.<br>אם לא ביקשת הזמנה זו, התעלם מהודעה זו.</p>
      </div>
    `,
  })
}
