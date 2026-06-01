export interface SmtpEmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  appBaseUrl: string
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || ''
}

export function getSmtpEmailConfig(): SmtpEmailConfig {
  return {
    host: readRequiredEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: readRequiredEnv('SMTP_USER'),
    pass: readRequiredEnv('SMTP_PASS'),
    from: readRequiredEnv('EMAIL_FROM'),
    appBaseUrl: readRequiredEnv('APP_BASE_URL'),
  }
}

export function validateSmtpEmailConfig(config: SmtpEmailConfig) {
  const missing: string[] = []

  if (!config.host) missing.push('SMTP_HOST')
  if (!config.port || Number.isNaN(config.port)) missing.push('SMTP_PORT')
  if (!config.user) missing.push('SMTP_USER')
  if (!config.pass) missing.push('SMTP_PASS')
  if (!config.from) missing.push('EMAIL_FROM')
  if (!config.appBaseUrl) missing.push('APP_BASE_URL')

  return {
    ok: missing.length === 0,
    missing,
  }
}
