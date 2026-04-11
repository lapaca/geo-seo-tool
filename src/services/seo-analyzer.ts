import type { CrawlData, SeoIssue, IssueStatus } from '@/types'

export class SeoAnalyzer {
  analyze(data: CrawlData): { issues: SeoIssue[]; score: number } {
    const issues: SeoIssue[] = [
      this.checkTitle(data),
      this.checkMetaDescription(data),
      this.checkH1(data),
      this.checkHeadingHierarchy(data),
      this.checkImageAlt(data),
      this.checkInternalLinks(data),
      this.checkExternalLinks(data),
      this.checkHttps(data),
      this.checkCanonical(data),
      this.checkOpenGraph(data),
      this.checkViewport(data),
      this.checkPageSize(data),
      this.checkRobotsTxt(data),
      this.checkSitemap(data),
    ]

    return { issues, score: this.calculateScore(issues) }
  }

  private checkTitle(data: CrawlData): SeoIssue {
    const title = data.title
    let status: IssueStatus = 'pass'
    let description = 'Title 标签正常'
    let recommendation = ''

    if (!title) {
      status = 'fail'
      description = '缺少 Title 标签'
      recommendation = '添加一个 30-60 字符的 Title 标签'
    } else if (title.length < 30) {
      status = 'warning'
      description = `Title 太短（${title.length} 字符），建议 30-60 字符`
      recommendation = '增加 Title 长度到 30-60 字符，包含核心关键词'
    } else if (title.length > 60) {
      status = 'warning'
      description = `Title 太长（${title.length} 字符），可能被搜索引擎截断`
      recommendation = '缩短 Title 到 60 字符以内'
    }

    return {
      id: 'title-length',
      category: 'meta',
      name: 'Title 标签',
      description,
      severity: 'high',
      status,
      currentValue: title,
      recommendation,
      weight: 10,
    }
  }

  private checkMetaDescription(data: CrawlData): SeoIssue {
    const desc = data.metaDescription
    let status: IssueStatus = 'pass'
    let description = 'Meta Description 正常'
    let recommendation = ''

    if (!desc) {
      status = 'fail'
      description = '缺少 Meta Description'
      recommendation = '添加 120-160 字符的 Meta Description'
    } else if (desc.length < 120) {
      status = 'warning'
      description = `Meta Description 太短（${desc.length} 字符）`
      recommendation = '增加到 120-160 字符，包含核心关键词和行动引导'
    } else if (desc.length > 160) {
      status = 'warning'
      description = `Meta Description 太长（${desc.length} 字符），可能被截断`
      recommendation = '缩短到 160 字符以内'
    }

    return {
      id: 'meta-description',
      category: 'meta',
      name: 'Meta Description',
      description,
      severity: 'high',
      status,
      currentValue: desc,
      recommendation,
      weight: 9,
    }
  }

  private checkH1(data: CrawlData): SeoIssue {
    const h1s = data.headings.filter((h) => h.level === 1)
    let status: IssueStatus = 'pass'
    let description = 'H1 标签正常'
    let recommendation = ''

    if (h1s.length === 0) {
      status = 'fail'
      description = '缺少 H1 标签'
      recommendation = '添加唯一的 H1 标签作为页面主标题'
    } else if (h1s.length > 1) {
      status = 'warning'
      description = `存在 ${h1s.length} 个 H1 标签，建议只有一个`
      recommendation = '保留一个 H1，其余改为 H2'
    }

    return {
      id: 'h1-tag',
      category: 'content',
      name: 'H1 标签',
      description,
      severity: 'high',
      status,
      currentValue: h1s.map((h) => h.text).join(', ') || null,
      recommendation,
      weight: 8,
    }
  }

  private checkHeadingHierarchy(data: CrawlData): SeoIssue {
    const levels = data.headings.map((h) => h.level)
    let status: IssueStatus = 'pass'
    let description = '标题层级结构合理'
    let recommendation = ''

    if (levels.length > 0) {
      let hasSkip = false
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          hasSkip = true
          break
        }
      }
      if (hasSkip) {
        status = 'warning'
        description = '标题层级存在跳跃（如 H1 直接到 H3）'
        recommendation = '保持标题层级连续，如 H1→H2→H3'
      }
    }

    return {
      id: 'heading-hierarchy',
      category: 'content',
      name: '标题层级',
      description,
      severity: 'medium',
      status,
      currentValue: levels.join('→') || null,
      recommendation,
      weight: 5,
    }
  }

  private checkImageAlt(data: CrawlData): SeoIssue {
    const total = data.images.length
    const withoutAlt = data.images.filter((img) => !img.alt).length
    let status: IssueStatus = 'pass'
    let description = '所有图片都有 alt 属性'
    let recommendation = ''

    if (total === 0) {
      description = '页面没有图片'
    } else if (withoutAlt > 0) {
      const pct = Math.round((withoutAlt / total) * 100)
      if (pct > 50) {
        status = 'fail'
        description = `${withoutAlt}/${total} 张图片缺少 alt 属性（${pct}%）`
      } else {
        status = 'warning'
        description = `${withoutAlt}/${total} 张图片缺少 alt 属性`
      }
      recommendation = '为所有图片添加描述性的 alt 属性'
    }

    return {
      id: 'image-alt',
      category: 'content',
      name: '图片 Alt 属性',
      description,
      severity: 'medium',
      status,
      currentValue: total > 0 ? `${total - withoutAlt}/${total} 有 alt` : '无图片',
      recommendation,
      weight: 6,
    }
  }

  private checkInternalLinks(data: CrawlData): SeoIssue {
    const count = data.internalLinks.length
    let status: IssueStatus = 'pass'
    let description = `页面有 ${count} 个内链`
    let recommendation = ''

    if (count < 3) {
      status = 'warning'
      description = `内链数量较少（${count} 个），建议至少 3 个`
      recommendation = '增加指向相关页面的内部链接'
    }

    return {
      id: 'internal-links',
      category: 'content',
      name: '内部链接',
      description,
      severity: 'low',
      status,
      currentValue: String(count),
      recommendation,
      weight: 4,
    }
  }

  private checkExternalLinks(data: CrawlData): SeoIssue {
    const count = data.externalLinks.length
    return {
      id: 'external-links',
      category: 'content',
      name: '外部链接',
      description: count > 0 ? `页面有 ${count} 个外链` : '页面没有外部链接',
      severity: 'low',
      status: 'pass',
      currentValue: String(count),
      recommendation: count === 0 ? '适当添加指向权威来源的外部链接可增强可信度' : '',
      weight: 3,
    }
  }

  private checkHttps(data: CrawlData): SeoIssue {
    const isHttps = data.isHttps
    return {
      id: 'https',
      category: 'technical',
      name: 'HTTPS',
      description: isHttps ? '网站使用 HTTPS' : '网站未使用 HTTPS',
      severity: 'high',
      status: isHttps ? 'pass' : 'fail',
      currentValue: isHttps ? 'HTTPS' : 'HTTP',
      recommendation: isHttps ? '' : '启用 HTTPS 加密连接',
      weight: 9,
    }
  }

  private checkCanonical(data: CrawlData): SeoIssue {
    const has = !!data.canonical
    return {
      id: 'canonical',
      category: 'technical',
      name: 'Canonical 标签',
      description: has ? 'Canonical 标签存在' : '缺少 Canonical 标签',
      severity: 'medium',
      status: has ? 'pass' : 'warning',
      currentValue: data.canonical,
      recommendation: has ? '' : '添加 canonical 标签防止重复内容问题',
      weight: 6,
    }
  }

  private checkOpenGraph(data: CrawlData): SeoIssue {
    const og = data.ogTags
    const missing: string[] = []
    if (!og.title) missing.push('og:title')
    if (!og.description) missing.push('og:description')
    if (!og.image) missing.push('og:image')

    let status: IssueStatus = 'pass'
    let description = 'Open Graph 标签完整'
    if (missing.length === 3) {
      status = 'fail'
      description = '缺少所有 Open Graph 标签'
    } else if (missing.length > 0) {
      status = 'warning'
      description = `缺少 ${missing.join(', ')}`
    }

    return {
      id: 'open-graph',
      category: 'social',
      name: 'Open Graph',
      description,
      severity: 'medium',
      status,
      currentValue: missing.length > 0 ? `缺少: ${missing.join(', ')}` : '完整',
      recommendation: missing.length > 0 ? `添加缺少的 OG 标签: ${missing.join(', ')}` : '',
      weight: 5,
    }
  }

  private checkViewport(data: CrawlData): SeoIssue {
    const has = !!data.viewport
    return {
      id: 'viewport',
      category: 'technical',
      name: '移动端适配',
      description: has ? 'viewport meta 标签存在' : '缺少 viewport meta 标签',
      severity: 'medium',
      status: has ? 'pass' : 'fail',
      currentValue: data.viewport,
      recommendation: has ? '' : '添加 <meta name="viewport" content="width=device-width, initial-scale=1">',
      weight: 7,
    }
  }

  private checkPageSize(data: CrawlData): SeoIssue {
    const sizeKB = Math.round(data.htmlSize / 1024)
    const sizeMB = data.htmlSize / (1024 * 1024)
    let status: IssueStatus = 'pass'
    let description = `HTML 大小 ${sizeKB}KB`
    let recommendation = ''

    if (sizeMB > 3) {
      status = 'fail'
      description = `HTML 过大（${sizeKB}KB），严重影响加载速度`
      recommendation = '优化 HTML 大小，考虑压缩、懒加载等'
    } else if (sizeMB > 1) {
      status = 'warning'
      description = `HTML 较大（${sizeKB}KB），可能影响加载速度`
      recommendation = '考虑优化 HTML 大小'
    }

    return {
      id: 'page-size',
      category: 'technical',
      name: '页面大小',
      description,
      severity: 'medium',
      status,
      currentValue: `${sizeKB}KB`,
      recommendation,
      weight: 5,
    }
  }

  private checkRobotsTxt(data: CrawlData): SeoIssue {
    const has = data.robotsTxt !== null
    let status: IssueStatus = has ? 'pass' : 'warning'
    let description = has ? 'robots.txt 可访问' : '未找到 robots.txt'

    if (has && data.robotsTxt!.includes('Disallow: /')) {
      const lines = data.robotsTxt!.split('\n')
      const disallowAll = lines.some(
        (l) => l.trim() === 'Disallow: /' && lines.some((l2) => l2.trim() === 'User-agent: *')
      )
      if (disallowAll) {
        status = 'fail'
        description = 'robots.txt 阻止了所有爬虫'
      }
    }

    return {
      id: 'robots-txt',
      category: 'technical',
      name: 'robots.txt',
      description,
      severity: 'high',
      status,
      currentValue: has ? '存在' : '不存在',
      recommendation: status === 'fail' ? '修改 robots.txt 允许搜索引擎爬虫访问' : (!has ? '创建 robots.txt 文件' : ''),
      weight: 7,
    }
  }

  private checkSitemap(data: CrawlData): SeoIssue {
    return {
      id: 'sitemap',
      category: 'technical',
      name: 'Sitemap',
      description: data.hasSitemap ? 'sitemap.xml 存在' : '未找到 sitemap.xml',
      severity: 'low',
      status: data.hasSitemap ? 'pass' : 'warning',
      currentValue: data.hasSitemap ? '存在' : '不存在',
      recommendation: data.hasSitemap ? '' : '创建 sitemap.xml 帮助搜索引擎发现页面',
      weight: 4,
    }
  }

  private calculateScore(issues: SeoIssue[]): number {
    let totalWeight = 0
    let earnedWeight = 0

    for (const issue of issues) {
      totalWeight += issue.weight
      if (issue.status === 'pass') {
        earnedWeight += issue.weight
      } else if (issue.status === 'warning') {
        earnedWeight += issue.weight * 0.5
      }
    }

    if (totalWeight === 0) return 100
    return Math.round((earnedWeight / totalWeight) * 100)
  }
}
