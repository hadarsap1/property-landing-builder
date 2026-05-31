/**
 * Bootstrap the first agency and admin agent.
 *
 * Usage:
 *   POSTGRES_URL=... npx tsx scripts/seed-agency.ts \
 *     --name="RE/MAX TLV" \
 *     --slug="remax-tlv" \
 *     --email="admin@remax-tlv.com" \
 *     --password="change-me-123"
 *
 * All four flags are required.
 */
import { createClient } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

function getArg(flag: string): string {
  const match = process.argv.find((a) => a.startsWith(`--${flag}=`))
  if (!match) { console.error(`Missing --${flag}`); process.exit(1) }
  return match.slice(flag.length + 3)
}

async function main() {
  const agencyName = getArg('name')
  const agencySlug = getArg('slug')
  const adminEmail = getArg('email')
  const adminPassword = getArg('password')

  const client = createClient()
  await client.connect()

  // Check for existing agency
  const { rows: existing } = await client.query(
    'SELECT id FROM agencies WHERE slug = $1',
    [agencySlug]
  )
  if (existing.length) {
    console.error(`Agency with slug "${agencySlug}" already exists.`)
    await client.end()
    process.exit(1)
  }

  // Create agency
  const { rows: agencyRows } = await client.query(
    `INSERT INTO agencies (slug, name, primary_color, secondary_color)
     VALUES ($1, $2, '#2563eb', '#1e3a5f')
     RETURNING id, slug, name`,
    [agencySlug, agencyName]
  )
  const agency = agencyRows[0] as { id: string; slug: string; name: string }
  console.log(`✓ Agency created: ${agency.name} (${agency.slug}) — id: ${agency.id}`)

  // Create admin agent
  const hash = await bcrypt.hash(adminPassword, 12)
  const { rows: agentRows } = await client.query(
    `INSERT INTO agents (agency_id, name, email, role, password_hash)
     VALUES ($1, $2, $3, 'admin', $4)
     RETURNING id, email, role`,
    [agency.id, 'Admin', adminEmail, hash]
  )
  const agent = agentRows[0] as { id: string; email: string; role: string }
  console.log(`✓ Admin agent created: ${agent.email} (${agent.role}) — id: ${agent.id}`)
  console.log(`\nLog in at /auth/login with:`)
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)

  await client.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
