import { describe, it, expect } from 'vitest'
import { Exporter } from '@/services/exporter'
import type { Optimization } from '@/types'

const mockOpts: Optimization[] = [
  {
    id: 'opt-1', type: 'title', issueId: 'title-length', label: 'Title 优化',
    original: 'Old Title', suggestions: ['New Title A', 'New Title B'],
    selectedIndex: 0, userEdited: null, accepted: true,
  },
  {
    id: 'opt-2', type: 'meta_description', issueId: 'meta-description', label: 'Description',
    original: null, suggestions: ['New desc'],
    selectedIndex: null, userEdited: 'Custom desc', accepted: true,
  },
  {
    id: 'opt-3', type: 'h1', issueId: 'h1-tag', label: 'H1',
    original: null, suggestions: ['H1'],
    selectedIndex: 0, userEdited: null, accepted: false, // not accepted
  },
]

describe('Exporter', () => {
  const exporter = new Exporter()

  it('should export only selected optimizations', () => {
    // Only pass opt-1 and opt-2 (opt-3 not selected)
    const result = exporter.export(mockOpts, ['opt-1', 'opt-2'], 'html')
    expect(result.content).toContain('New Title A')
    expect(result.content).toContain('Custom desc')
    expect(result.content).not.toContain('<h1>H1</h1>')
  })

  it('should filter by selected IDs', () => {
    const result = exporter.export(mockOpts, ['opt-1'], 'html')
    expect(result.content).toContain('New Title A')
    expect(result.content).not.toContain('Custom desc')
  })

  it('should export JSON format', () => {
    const result = exporter.export(mockOpts, ['opt-1'], 'json')
    const parsed = JSON.parse(result.content)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].type).toBe('title')
  })

  it('should export Markdown format', () => {
    const result = exporter.export(mockOpts, ['opt-1'], 'markdown')
    expect(result.content).toContain('# GEO+SEO Optimizations')
    expect(result.content).toContain('New Title A')
  })

  it('should use userEdited over suggestion', () => {
    const result = exporter.export(mockOpts, ['opt-2'], 'html')
    expect(result.content).toContain('Custom desc')
    expect(result.content).not.toContain('New desc')
  })
})
