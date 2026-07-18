import { describe, expect, it } from 'vitest'
import type { Note } from './personal'
import { searchNotes } from './searchNotes'

const anteckning = (id: string, text: string, updated: string): Note => ({
  ursprungTyp: 'rum',
  ursprungId: id,
  text,
  created: '2026-07-01',
  updated,
})

const anteckningar: Record<string, Note> = {
  a: anteckning('a', 'En tanke om förlåtelse och att släppa taget.', '2026-07-10'),
  b: anteckning('b', 'Om oron inför morgondagen.', '2026-07-12'),
  c: anteckning('c', '   ', '2026-07-13'),
}

describe('sokAnteckningar', () => {
  it('hittar anteckningar på normaliserad text (forlatelse hittar förlåtelse)', () => {
    expect(searchNotes('forlatelse', anteckningar).map((a) => a.ursprungId)).toEqual(['a'])
  })

  it('ger inget för tom eller för kort fråga', () => {
    expect(searchNotes('', anteckningar)).toEqual([])
    expect(searchNotes('a', anteckningar)).toEqual([])
  })

  it('ger inget när frågan bara är stopord', () => {
    expect(searchNotes('om och att', anteckningar)).toEqual([])
  })

  it('sorterar senast ändrad först', () => {
    const extended = { ...anteckningar, d: anteckning('d', 'Mer om förlåtelse.', '2026-07-14') }
    expect(searchNotes('förlåtelse', extended).map((a) => a.ursprungId)).toEqual(['d', 'a'])
  })

  it('utelämnar tomma anteckningar', () => {
    expect(searchNotes('tanke', anteckningar).some((a) => a.ursprungId === 'c')).toBe(false)
  })
})
