import { sql as vercelSql, db as vercelDb, createClient } from '@vercel/postgres'
import type { QueryResult, QueryResultRow } from '@vercel/postgres'

/**
 * @vercel/postgres speaks Neon's fetch/WebSocket protocol and cannot reach a
 * plain Postgres server. For local development and CI (E2E tests against a
 * postgres service container) we fall back to node-postgres when POSTGRES_URL
 * points at localhost.
 */
const connectionString = process.env.POSTGRES_URL ?? ''
const useLocalPg = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString)

interface DbClient {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>
  release(): void
}

interface Db {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>
  connect(): Promise<DbClient>
}

type SqlTag = <T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<QueryResult<T>>

function buildLocal(): { sql: SqlTag; db: Db } {
  // Lazy require so 'pg' is only loaded when actually running against local PG
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg')
  const pool = new Pool({ connectionString })

  const localSql: SqlTag = (strings, ...values) => {
    const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ''), '')
    return pool.query(text, values as unknown[])
  }

  const localDb: Db = {
    query: (text, values) => pool.query(text, values as unknown[]),
    connect: async () => {
      const client = await pool.connect()
      return {
        query: (text, values) => client.query(text, values as unknown[]),
        release: () => client.release(),
      }
    },
  }

  return { sql: localSql, db: localDb }
}

const local = useLocalPg ? buildLocal() : null

export const sql: SqlTag = local ? local.sql : (vercelSql as SqlTag)
export const db: Db = local ? local.db : (vercelDb as unknown as Db)
export { createClient }
