import { describe, expect, it } from 'vitest'
import type { ContentSet, Question, Room, Source, Theme } from './schema'
import { validateContent } from './validate'

const room = (over: Partial<Room> = {}): Room => ({
  id: 'room-a',
  slug: 'room-a',
  title: 'Rum A',
  summary: 'Sammanfattning.',
  primaryQuestionId: 'fraga-a',
  themeIds: ['tema-a'],
  thoughtToCarry: 'En tanke.',
  reflectionQuestions: ['En fråga?'],
  sources: [{ sourceId: 'kalla-a', usage: 'adaptation', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status: 'draft',
  createdAt: '2026-07-09',
  updatedAt: '2026-07-09',
  opening: 'Öppning.',
  core: 'Kärna.',
  ...over,
})

const theme = (over: Partial<Theme> = {}): Theme => ({
  id: 'tema-a',
  slug: 'tema-a',
  label: 'Tema A',
  status: 'published',
  ...over,
})

const question = (over: Partial<Question> = {}): Question => ({
  id: 'fraga-a',
  slug: 'fraga-a',
  text: 'Vad är A?',
  themeIds: ['tema-a'],
  status: 'published',
  ...over,
})

const source = (over: Partial<Source> = {}): Source => ({
  id: 'kalla-a',
  slug: 'kalla-a',
  title: 'Källa A',
  sourceType: 'book',
  copyrightStatus: 'public-domain',
  status: 'published',
  ...over,
})

const baseSet = (over: Partial<ContentSet> = {}): ContentSet => ({
  rooms: [room()],
  themes: [theme()],
  questions: [question()],
  paths: [],
  sources: [source()],
  passages: [],
  traditions: [],
  people: [],
  ...over,
})

describe('validateContent', () => {
  it('godkänner en konsistent innehållsmängd', () => {
    expect(validateContent(baseSet())).toEqual([])
  })

  it('fångar dubblerade id och sluggar inom en samling', () => {
    const errors = validateContent(
      baseSet({ themes: [theme(), theme({ label: 'Kopia' })] }),
    )
    expect(errors.some((e) => e.includes('tema-a') && e.includes('dubblett'))).toBe(true)
  })

  it('fångar rum vars primära fråga inte finns', () => {
    const errors = validateContent(baseSet({ rooms: [room({ primaryQuestionId: 'saknas' })] }))
    expect(errors.some((e) => e.includes('room-a') && e.includes('saknas'))).toBe(true)
  })

  it('fångar rum med okänt tema och okänd källa', () => {
    const errors = validateContent(
      baseSet({
        rooms: [
          room({
            themeIds: ['tema-x'],
            sources: [{ sourceId: 'kalla-x', usage: 'adaptation', primary: true }],
          }),
        ],
      }),
    )
    expect(errors.some((e) => e.includes('tema-x'))).toBe(true)
    expect(errors.some((e) => e.includes('kalla-x'))).toBe(true)
  })

  it('kräver primär källa för publicerade rum men inte för utkast', () => {
    const utanPrimar = [{ sourceId: 'kalla-a', usage: 'adaptation' as const, primary: false }]
    const utkast = validateContent(baseSet({ rooms: [room({ sources: utanPrimar })] }))
    expect(utkast).toEqual([])
    const publicerat = validateContent(
      baseSet({ rooms: [room({ status: 'published', sources: utanPrimar })] }),
    )
    expect(publicerat.some((e) => e.includes('primär källa'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerat innehåll', () => {
    const errors = validateContent(
      baseSet({
        rooms: [room({ status: 'published' })],
        questions: [question({ status: 'draft' })],
        sources: [source({ status: 'review' })],
      }),
    )
    expect(errors.some((e) => e.includes('fraga-a') && e.includes('opublicerad'))).toBe(true)
    expect(errors.some((e) => e.includes('kalla-a') && e.includes('opublicerad'))).toBe(true)
  })

  it('begränsar lästiden för publicerade rum till 1–10 minuter', () => {
    const errors = validateContent(
      baseSet({ rooms: [room({ status: 'published', readingTimeMinutes: 12 })] }),
    )
    expect(errors.some((e) => e.includes('lästid'))).toBe(true)
    expect(validateContent(baseSet({ rooms: [room({ readingTimeMinutes: 12 })] }))).toEqual([])
  })

  it('kräver att temats defaultrum finns och tillhör temat', () => {
    const okant = validateContent(baseSet({ themes: [theme({ defaultRoomId: 'room-x' })] }))
    expect(okant.some((e) => e.includes('room-x'))).toBe(true)
    const felTema = validateContent(
      baseSet({
        themes: [theme(), theme({ id: 'tema-b', slug: 'tema-b', defaultRoomId: 'room-a' })],
      }),
    )
    expect(felTema.some((e) => e.includes('tema-b') && e.includes('tillhör'))).toBe(true)
  })

  it('kräver publicerat defaultrum för publicerade teman', () => {
    const errors = validateContent(baseSet({ themes: [theme({ defaultRoomId: 'room-a' })] }))
    expect(errors.some((e) => e.includes('opublicer'))).toBe(true)
  })

  it('fångar brutna relationer från frågor, vandringar och passager', () => {
    const errors = validateContent(
      baseSet({
        questions: [question({ themeIds: ['tema-x'], relatedQuestionIds: ['fraga-x'] })],
        paths: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestionId: 'fraga-x',
            roomIds: ['room-a', 'room-x', 'room-y'],
            status: 'draft',
            createdAt: '2026-07-09',
            updatedAt: '2026-07-09',
          },
        ],
        passages: [
          { id: 'passage-a', sourceId: 'kalla-x', reference: 'avsnitt 1', status: 'draft' },
        ],
      }),
    )
    expect(errors.some((e) => e.includes('fraga-a') && e.includes('tema-x'))).toBe(true)
    expect(errors.some((e) => e.includes('fraga-a') && e.includes('fraga-x'))).toBe(true)
    expect(errors.some((e) => e.includes('vandring-a') && e.includes('room-x'))).toBe(true)
    expect(errors.some((e) => e.includes('passage-a') && e.includes('kalla-x'))).toBe(true)
  })

  it('hindrar publicerade vandringar från att innehålla opublicerade rum', () => {
    const errors = validateContent(
      baseSet({
        rooms: [room(), room({ id: 'room-b', slug: 'room-b' }), room({ id: 'room-c', slug: 'room-c' })],
        paths: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestionId: 'fraga-a',
            roomIds: ['room-a', 'room-b', 'room-c'],
            status: 'published',
            createdAt: '2026-07-09',
            updatedAt: '2026-07-09',
          },
        ],
      }),
    )
    expect(errors.some((e) => e.includes('vandring-a') && e.includes('opublicer'))).toBe(true)
  })
})
