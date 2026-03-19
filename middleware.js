import { next } from '@vercel/functions'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])
const AUTH_REALM = 'Protected'

function isLocalHostname(hostname) {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.local')
}

function createPlainTextResponse(message, status, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  })
}

function parseBasicAuthorizationHeader(headerValue) {
  if (typeof headerValue !== 'string') {
    return null
  }

  const [scheme, encodedValue] = headerValue.split(/\s+/, 2)
  if (!scheme || !encodedValue || scheme.toLowerCase() !== 'basic') {
    return null
  }

  try {
    const decodedValue = atob(encodedValue)
    const separatorIndex = decodedValue.indexOf(':')

    if (separatorIndex < 0) {
      return null
    }

    return {
      username: decodedValue.slice(0, separatorIndex),
      password: decodedValue.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

export default function middleware(request) {
  const url = new URL(request.url)

  if (isLocalHostname(url.hostname)) {
    return next()
  }

  const expectedUsername = process.env.SITE_USERNAME?.trim()
  const expectedPassword = process.env.SITE_PASSWORD?.trim()

  if (!expectedUsername || !expectedPassword) {
    return createPlainTextResponse(
      'Server misconfiguration: SITE_USERNAME and SITE_PASSWORD must both be set.',
      500,
    )
  }

  const credentials = parseBasicAuthorizationHeader(request.headers.get('authorization'))

  if (
    !credentials ||
    credentials.username !== expectedUsername ||
    credentials.password !== expectedPassword
  ) {
    return createPlainTextResponse('Authentication required.', 401, {
      'www-authenticate': `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
    })
  }

  return next()
}
