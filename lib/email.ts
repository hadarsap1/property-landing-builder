import nodemailer from 'nodemailer'

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
}: {
  to: string
  leadName: string | null
  leadPhone: string | null
  leadEmail: string | null
  listingTitle: string
  listingUrl: string
}): Promise<void> {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info(`\n[lead-notify] New lead for "${listingTitle}" from ${leadName ?? 'אנונימי'} (${leadPhone ?? leadEmail ?? '—'})`)
    return
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  const contact = [leadPhone, leadEmail].filter(Boolean).join(' · ') || '—'

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `ליד חדש: ${listingTitle}`,
    text: `ליד חדש התקבל לנכס "${listingTitle}".\n\nשם: ${leadName ?? '—'}\nיצירת קשר: ${contact}\n\nצפה בלוח הבקרה:\n${listingUrl}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e3a5f">ליד חדש התקבל</h2>
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
