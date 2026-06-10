/**
 * Runtime environment variable validation.
 * Call these getters in server code — they throw immediately with a clear
 * message rather than failing silently with an empty string.
 */

function require(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

export const env = {
  get NEXTAUTH_SECRET() { return require('NEXTAUTH_SECRET') },
  get ANTHROPIC_API_KEY() { return require('ANTHROPIC_API_KEY') },
  get STRIPE_SECRET_KEY() { return require('STRIPE_SECRET_KEY') },
  get STRIPE_WEBHOOK_SECRET() { return require('STRIPE_WEBHOOK_SECRET') },
  get POSTGRES_URL() { return require('POSTGRES_URL') },
  /** Optional — falls back gracefully when absent */
  get KV_URL() { return process.env.KV_URL },
  get BLOB_READ_WRITE_TOKEN() { return process.env.BLOB_READ_WRITE_TOKEN },
  get SUPER_ADMIN_EMAIL() { return process.env.SUPER_ADMIN_EMAIL },
  get ROOT_DOMAIN() { return process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app' },
  get NEXTAUTH_URL() { return process.env.NEXTAUTH_URL },
}
