import nodemailer from 'nodemailer'

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
