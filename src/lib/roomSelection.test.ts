import { describe, expect, it } from 'vitest'
import type { Room, Theme } from '../content/editorial/schema'
import { valbaraRoom, selectRoom } from './roomSelection'

// Fabricerade poster: bara fälten urvalet läser behöver vara meningsfulla.
const rum = (id: string, themes: string[], status: Room['status'] = 'published'): Room => ({
  id,
  slug: id,
  title: id,
  summary: 'x',
  primaryQuestion: 'fraga-x',
  themes,
  thoughtToCarry: 'x',
  reflectionQuestions: ['x?'],
  sources: [{ source: 'kalla-x', use: 'adaptation', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status,
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'x',
  core: 'x',
})

const tema = (id: string, defaultRoom?: string): Theme => ({
  id,
  slug: id,
  label: id,
  defaultRoom,
  status: 'published',
})

describe('valbaraRum', () => {
  it('släpper bara igenom publicerade rum med temat', () => {
    const all = [
      rum('a', ['lugn']),
      rum('b', ['lugn'], 'draft'),
      rum('c', ['lugn'], 'review'),
      rum('d', ['lugn'], 'archived'),
      rum('e', ['mod']),
    ]
    expect(valbaraRoom('lugn', all).map((r) => r.id)).toEqual(['a'])
  })
})

describe('valjRum', () => {
  it('ger null när temat saknar publicerade rum', () => {
    expect(selectRoom(tema('lugn'), [rum('a', ['lugn'], 'draft')], [])).toBeNull()
  })

  it('väljer standardrummet vid första besöket', () => {
    const all = [rum('a', ['lugn']), rum('b', ['lugn'])]
    expect(selectRoom(tema('lugn', 'b'), all, [])?.id).toBe('b')
  })

  it('undviker nyligen läst standardrum när alternativ finns', () => {
    const all = [rum('a', ['lugn']), rum('b', ['lugn'])]
    expect(selectRoom(tema('lugn', 'b'), all, ['b'])?.id).toBe('a')
  })

  it('tillåter upprepning när allt är nyligen läst', () => {
    const all = [rum('a', ['lugn'])]
    expect(selectRoom(tema('lugn', 'a'), all, ['a'])?.id).toBe('a')
  })

  it('föredrar aldrig lästa alternativ före längst-sedan-lästa', () => {
    const all = [rum('a', ['lugn']), rum('b', ['lugn']), rum('c', ['lugn'])]
    // a är standard men nyss läst; b lästes tidigare; c har aldrig lästs.
    expect(selectRoom(tema('lugn', 'a'), all, ['a', 'b'])?.id).toBe('c')
  })

  it('glömmer historik bortom de tre senaste', () => {
    const all = [rum('a', ['lugn']), rum('b', ['lugn'])]
    // a lästes för länge sedan (fjärde platsen) — får väljas som standard igen.
    expect(selectRoom(tema('lugn', 'a'), all, ['x1', 'x2', 'x3', 'a'])?.id).toBe('a')
  })

  it('väljer deterministiskt bland lika kandidater i innehållsordning', () => {
    const all = [rum('a', ['lugn']), rum('b', ['lugn'])]
    // Inget standardrum, ingen historik: första i innehållsordningen vinner.
    expect(selectRoom(tema('lugn'), all, [])?.id).toBe('a')
  })
})
