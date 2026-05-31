/**
 * Run once to apply schema.sql against the Vercel Postgres database.
 * Usage: npx tsx scripts/db-migrate.ts
 *
 * Requires POSTGRES_URL (or POSTGRES_URL_NON_POOLING) in the environment.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@vercel/postgres'

async function migrate() {
  const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')

  // Split on statement-terminating semicolons, drop blanks
  const statements = schema
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)

  const client = createClient()
  await client.connect()

  console.log(`Running ${statements.length} SQL statements…`)

  for (const statement of statements) {
    try {
      await client.query(statement)
    } catch (err) {
      console.error('Failed on:\n', statement, '\n')
      await client.end()
      throw err
    }
  }

  await client.end()
  console.log('Migration complete.')
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
