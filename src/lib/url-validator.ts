import { lookup } from 'dns/promises'
import { createHash } from 'crypto'
import { isIPv4, isIPv6 } from 'net'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
])

function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isPrivateIPv4(ip: string): boolean {
  if (!isIPv4(ip)) return false
  const num = ipToLong(ip)

  // 0.0.0.0/8
  if ((num >>> 24) === 0) return true
  // 10.0.0.0/8
  if ((num >>> 24) === 10) return true
  // 100.64.0.0/10 (CGNAT)
  if ((num >>> 22) === (100 << 2 | 1)) return true
  // 127.0.0.0/8
  if ((num >>> 24) === 127) return true
  // 169.254.0.0/16 (link-local)
  if ((num >>> 16) === (169 << 8 | 254)) return true
  // 172.16.0.0/12
  if ((num >>> 20) === (172 << 4 | 1)) return true
  // 192.168.0.0/16
  if ((num >>> 16) === (192 << 8 | 168)) return true
  // NOTE: 198.18.0.0/15 (benchmark) is NOT blocked — proxy tools (Surge/Clash)
  // resolve all domains to this range as virtual IPs

  return false
}

function isPrivateIPv6(ip: string): boolean {
  if (!isIPv6(ip)) return false
  const normalized = ip.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('fe80:')) return true   // link-local
  if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true // ULA
  // IPv4-mapped IPv6: ::ffff:x.x.x.x
  if (normalized.startsWith('::ffff:')) {
    const v4part = normalized.slice(7)
    if (isIPv4(v4part)) return isPrivateIPv4(v4part)
  }
  return false
}

function isPrivateIP(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip)
}

export async function validateUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: 'URL 格式不正确' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: '仅支持 http/https 协议' }
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return { valid: false, error: '不允许访问本地地址' }
  }

  // Block direct IP addresses (hex/octal/decimal encoding bypass)
  // If hostname parses as IP, validate directly
  if (isIPv4(hostname) || isIPv6(hostname)) {
    if (isPrivateIP(hostname)) {
      return { valid: false, error: '不允许访问内网地址' }
    }
  }

  // Port restriction
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80)
  if (port !== 80 && port !== 443) {
    return { valid: false, error: '仅支持 80/443 端口' }
  }

  // DNS resolve and check ALL resolved IPs
  try {
    const result = await lookup(hostname, { all: true })
    for (const entry of result) {
      if (isPrivateIP(entry.address)) {
        return { valid: false, error: '不允许访问内网地址' }
      }
    }
  } catch {
    return { valid: false, error: '域名解析失败' }
  }

  return { valid: true }
}

export function normalizeUrl(url: string): string {
  const parsed = new URL(url)
  // Only lowercase hostname, preserve path case
  parsed.hostname = parsed.hostname.toLowerCase()
  parsed.hash = ''
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
  trackingParams.forEach((p) => parsed.searchParams.delete(p))
  let normalized = parsed.toString()
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1)
  return normalized
}

export function hashUrl(url: string): string {
  return createHash('sha256').update(normalizeUrl(url)).digest('hex')
}
