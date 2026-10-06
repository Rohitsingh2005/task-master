import { describe, expect, it } from 'vitest'

import {
  daysUntil,
  formatClock,
  formatDuration,
  formatRelativeTime,
  pluralize,
  startOfWeek,
} from './format'

describe('formatDuration', () => {
  it.each([
    [0, '0m'],
    [45 * 1000, '45s'],
    [5 * 60 * 1000, '5m'],
    [60 * 60 * 1000, '1h'],
    [95 * 60 * 1000, '1h 35m'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})

describe('formatClock', () => {
  it('pads hours, minutes and seconds', () => {
    expect(formatClock(3723 * 1000)).toBe('01:02:03')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-10T12:00:00Z').getTime()

  it.each([
    ['2026-10-10T11:59:30Z', 'Just now'],
    ['2026-10-10T11:15:00Z', '45m ago'],
    ['2026-10-10T07:00:00Z', '5h ago'],
    ['2026-10-08T12:00:00Z', '2d ago'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatRelativeTime(date, now)).toBe(expected)
  })
})

describe('date helpers', () => {
  it('counts whole days until a date', () => {
    const now = new Date(2026, 9, 10, 18, 30)

    expect(daysUntil('2026-10-10', now)).toBe(0)
    expect(daysUntil('2026-10-13', now)).toBe(3)
    expect(daysUntil('2026-10-09', now)).toBe(-1)
  })

  it('starts the week on Monday', () => {
    const sunday = new Date(2026, 9, 11)

    expect(startOfWeek(sunday).getDay()).toBe(1)
    expect(startOfWeek(sunday).getDate()).toBe(5)
  })

  it('pluralizes words', () => {
    expect(pluralize(1, 'ticket')).toBe('1 ticket')
    expect(pluralize(3, 'ticket')).toBe('3 tickets')
  })
})
