import { lookup } from 'dns/promises'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
])

function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('127.')) return true
  if (ip === '0.0.0.0') return true

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10)
    if (second >= 16 && second <= 31) return true
  }

  // Link-local
  if (ip.startsWith('169.254.')) return true

  // IPv6 local
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true
  }

  return false
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

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: '不允许访问本地地址' }
  }

  // Port restriction
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80)
  if (port !== 80 && port !== 443) {
    return { valid: false, error: '仅支持 80/443 端口' }
  }

  // DNS resolve and check resolved IP
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
  parsed.hash = ''
  // Remove common tracking params
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
  trackingParams.forEach((p) => parsed.searchParams.delete(p))
  let normalized = parsed.toString()
  // Remove trailing slash
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1)
  return normalized.toLowerCase()
}

export function hashUrl(url: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(normalizeUrl(url)).digest('hex')
}
