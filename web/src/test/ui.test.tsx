import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScoreRing } from '../components/common/ScoreRing'
import { StatusBadge } from '../components/common/StatusBadge'
import { ConfidenceBar } from '../components/common/ConfidenceBar'

describe('Modular UI Components', () => {
  it('renders ScoreRing with correct value and accessibility attributes', () => {
    const { container } = render(<ScoreRing score={88} verdict="go" />)
    const ring = container.querySelector('.score-ring')
    expect(ring).toBeDefined()
    expect(ring?.getAttribute('aria-valuenow')).toBe('88')
    expect(container.textContent).toContain('88')
  })

  it('renders StatusBadge with verdict class', () => {
    const { container } = render(<StatusBadge type="verdict" verdict="wait" />)
    expect(container.textContent).toContain('Wait')
    expect(container.querySelector('.badge-wait')).toBeDefined()
  })

  it('renders ConfidenceBar with percentage', () => {
    const { container } = render(<ConfidenceBar label="Cirrus" value={0.75} />)
    expect(container.textContent).toContain('Cirrus')
    expect(container.textContent).toContain('75%')
  })
})
