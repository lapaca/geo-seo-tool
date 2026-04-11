import type { Optimization, ExportFormat, ExportResult } from '@/types'

export class Exporter {
  export(optimizations: Optimization[], selectedIds: string[], format: ExportFormat): ExportResult {
    const items = optimizations.filter((o) => selectedIds.includes(o.id))

    let content: string
    switch (format) {
      case 'html':
        content = this.toHtml(items)
        break
      case 'json':
        content = this.toJson(items)
        break
      case 'markdown':
        content = this.toMarkdown(items)
        break
    }

    return {
      format,
      content,
      filename: `seo-geo-optimizations.${format === 'markdown' ? 'md' : format}`,
    }
  }

  private getSelectedContent(item: Optimization): string {
    if (item.userEdited) return item.userEdited
    if (item.selectedIndex !== null && item.suggestions[item.selectedIndex]) {
      return item.suggestions[item.selectedIndex]
    }
    return item.suggestions[0] || ''
  }

  private toHtml(items: Optimization[]): string {
    const parts: string[] = ['<!-- GEO+SEO Optimizations -->']

    for (const item of items) {
      const content = this.getSelectedContent(item)

      switch (item.type) {
        case 'title':
          parts.push(`<title>${content}</title>`)
          break
        case 'meta_description':
          parts.push(`<meta name="description" content="${content.replace(/"/g, '&quot;')}">`)
          break
        case 'h1':
          parts.push(`<h1>${content}</h1>`)
          break
        case 'structured_data':
        case 'faq_schema':
          parts.push(`<script type="application/ld+json">\n${content}\n</script>`)
          break
        case 'alt_text':
          parts.push(`<!-- Alt text: ${content} -->`)
          break
        default:
          parts.push(`<!-- ${item.label} -->\n${content}`)
      }
    }

    return parts.join('\n\n')
  }

  private toJson(items: Optimization[]): string {
    const result = items.map((item) => ({
      type: item.type,
      label: item.label,
      original: item.original,
      optimized: this.getSelectedContent(item),
    }))
    return JSON.stringify(result, null, 2)
  }

  private toMarkdown(items: Optimization[]): string {
    const parts: string[] = ['# GEO+SEO Optimizations', '']

    for (const item of items) {
      const content = this.getSelectedContent(item)
      parts.push(`## ${item.label}`)
      if (item.original) {
        parts.push(`**Original:** ${item.original}`)
      }
      parts.push(`**Optimized:** ${content}`)
      parts.push('')
    }

    return parts.join('\n')
  }
}
