import { describe, expect, it } from 'vitest'
import type { Note } from './personal'
import { searchNotes } from './searchNotes'

const note = (id: string, text: string, updated: string): Note => ({
  originType: 'room',
  originId: id,
  text,
  created: '2026-07-01',
  updated,
})

const notes: Record<string, Note> = {
  a: note('a', 'En tanke om förlåtelse och att släppa taget.', '2026-07-10'),
  b: note('b', 'Om oron inför morgondagen.', '2026-07-12'),
  c: note('c', '   ', '2026-07-13'),
}

describe('sokAnteckningar', () => {
  it('hittar anteckningar på normaliserad text (forlatelse hittar förlåtelse)', () => {
    expect(searchNotes('forlatelse', notes).map((a) => a.originId)).toEqual(['a'])
  })

  it('ger inget för tom eller för kort fråga', () => {
    expect(searchNotes('', notes)).toEqual([])
    expect(searchNotes('a', notes)).toEqual([])
  })

  it('ger inget när frågan bara är stopord', () => {
    expect(searchNotes('om och att', notes)).toEqual([])
  })

  it('sorterar senast ändrad först', () => {
    const extended = { ...notes, d: note('d', 'Mer om förlåtelse.', '2026-07-14') }
    expect(searchNotes('förlåtelse', extended).map((a) => a.originId)).toEqual(['d', 'a'])
  })

  it('utelämnar tomma anteckningar', () => {
    expect(searchNotes('tanke', notes).some((a) => a.originId === 'c')).toBe(false)
  })
})
