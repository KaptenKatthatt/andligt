import { describe, expect, it } from 'vitest'
import type { Rum, Tema, Tradition } from '../content/redaktion/schema'
import { bibliotekRum, bibliotekTeman, bibliotekTraditioner, rumForKalla } from './bibliotek'

// Fabricerade poster: bara fälten biblioteket läser behöver vara meningsfulla.
const rum = (titel: string, status: Rum['status'] = 'publicerad', över: Partial<Rum> = {}): Rum => ({
  id: `rum-${titel}`,
  slug: titel,
  titel,
  sammanfattning: 'x',
  primärFråga: 'fraga-x',
  teman: ['tema-x'],
  tankeAttBära: 'x',
  reflektionsfrågor: ['x?'],
  källor: [{ källa: 'kalla-x', bruk: 'bearbetning', primär: true }],
  lästidMinuter: 4,
  språk: 'sv',
  status,
  skapad: '2026-07-12',
  uppdaterad: '2026-07-12',
  öppning: 'x',
  kärna: 'x',
  ...över,
})

const tema = (
  etikett: string,
  extra: Partial<Pick<Tema, 'status' | 'ordning'>> = {},
): Tema => ({
  id: `tema-${etikett}`,
  slug: etikett,
  etikett,
  status: 'publicerad',
  ...extra,
})

describe('bibliotekTeman', () => {
  it('släpper bara igenom publicerade teman — utkast hör inte hemma i biblioteket', () => {
    const teman = [
      tema('lugn'),
      tema('mod', { status: 'utkast' }),
      tema('sanning', { status: 'granskning' }),
      tema('mening', { status: 'arkiverad' }),
    ]
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual(['lugn'])
  })

  it('följer redaktionell ordning och därefter svensk etikettordning', () => {
    const teman = [
      tema('österlandet'),
      tema('ande'),
      tema('mening', { ordning: 2 }),
      tema('lugn', { ordning: 1 }),
    ]
    // Ordnade teman först; oordnade sist i svensk ordning (ö efter a).
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual([
      'lugn',
      'mening',
      'ande',
      'österlandet',
    ])
  })
})

describe('bibliotekRum', () => {
  it('släpper bara igenom publicerade rum, i svensk titelordning', () => {
    const alla = [
      rum('över tröskeln'),
      rum('att vänta'),
      rum('utkastet', 'utkast'),
      rum('granskningen', 'granskning'),
      rum('arkivet', 'arkiverad'),
    ]
    expect(bibliotekRum(alla).map((r) => r.titel)).toEqual(['att vänta', 'över tröskeln'])
  })
})

describe('rumForKalla', () => {
  const relation = (källa: string, primär: boolean) => ({
    källa,
    bruk: 'bearbetning' as const,
    primär,
  })

  it('hittar publicerade rum med källan, primär relation först', () => {
    const alla = [
      rum('annan källa', 'publicerad', { källor: [relation('kalla-b', true)] }),
      rum('bygger på källan', 'publicerad', { källor: [relation('kalla-a', false)] }),
      rum('utkast med källan', 'utkast', { källor: [relation('kalla-a', true)] }),
      rum('vilar på källan', 'publicerad', { källor: [relation('kalla-a', true)] }),
      rum('andrahandsbruk', 'publicerad', { källor: [relation('kalla-a', false)] }),
    ]
    expect(rumForKalla('kalla-a', alla).map((r) => r.titel)).toEqual([
      'vilar på källan',
      'andrahandsbruk',
      'bygger på källan',
    ])
  })
})

describe('bibliotekTraditioner', () => {
  const tradition = (namn: string, status: Tradition['status'] = 'publicerad'): Tradition => ({
    id: `tradition-${namn}`,
    slug: namn,
    namn,
    status,
  })

  it('släpper bara igenom publicerade traditioner, i svensk namnordning', () => {
    const alla = [tradition('stoicism'), tradition('buddhism'), tradition('taoism', 'utkast')]
    expect(bibliotekTraditioner(alla).map((t) => t.namn)).toEqual(['buddhism', 'stoicism'])
  })
})
