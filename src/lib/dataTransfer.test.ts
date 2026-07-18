import { describe, expect, it } from 'vitest'
import {
  EXPORT_FORMAT,
  readImport,
  mergeImport,
  toExport,
  toMarkdown,
  type PersonalCollections,
} from './dataTransfer'
import type { Origin } from './personal'

const titelFor = (type: Origin, id: string): string | undefined => `${type}:${id}`

const samlingar = (): PersonalCollections => ({
  anteckningar: {
    'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'en tanke', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-05T00:00:00.000Z' },
  },
  sparadeRum: { 'rum-a': { sparadNar: '2026-07-02T00:00:00.000Z' } },
  sparadeVandringar: { 'vandring-x': { sparadNar: null } },
  bookmarks: { 'topic-1': true, 'topic-2': false },
  chapterBookmarks: {
    'w/b:3': { workId: 'w', bookSlug: 'b', chapter: 3, bookName: 'Boken', savedAt: 10 },
  },
})

describe('tillExport', () => {
  it('bygger en exportpost med format, version och uppslagna titlar', () => {
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(exporten.format).toBe(EXPORT_FORMAT)
    expect(exporten.version).toBe(1)
    expect(exporten.anteckningar[0]?.title).toBe('rum:rum-a')
    expect(exporten.sparadeRum[0]).toMatchObject({ id: 'rum-a', title: 'rum:rum-a' })
    expect(exporten.sparadeVandringar[0]?.id).toBe('vandring-x')
    expect(exporten.bokmarken.amnen).toEqual(['topic-1'])
    expect(exporten.bokmarken.kapitel).toHaveLength(1)
  })
})

describe('lasImport', () => {
  it('round-trippar en export genom JSON tillbaka till samma data', () => {
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const tillbaka = readImport(JSON.parse(JSON.stringify(exporten)))
    expect(tillbaka).toEqual(exporten)
  })

  it('avvisar fel format, fel version och korrupt indata med null', () => {
    expect(readImport(null)).toBeNull()
    expect(readImport('trasig')).toBeNull()
    expect(readImport({ format: 'något-annat', version: 1 })).toBeNull()
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(readImport({ ...exporten, version: 2 })).toBeNull()
    expect(readImport({ ...exporten, anteckningar: 'inte-en-lista' })).toBeNull()
  })
})

describe('mergaImport', () => {
  it('unionar sparade poster och bokmärken utan att röra befintlig data', () => {
    const nuvarande: PersonalCollections = {
      anteckningar: {},
      sparadeRum: { 'rum-b': { sparadNar: '2026-07-09T00:00:00.000Z' } },
      sparadeVandringar: {},
      bookmarks: { egen: true },
      chapterBookmarks: {},
    }
    const importen = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const ut = mergeImport(nuvarande, importen)
    expect(Object.keys(ut.sparadeRum).sort()).toEqual(['rum-a', 'rum-b'])
    expect(ut.bookmarks).toMatchObject({ egen: true, 'topic-1': true })
    expect(Object.keys(ut.chapterBookmarks)).toEqual(['w/b:3'])
  })

  it('låter den nyast uppdaterade anteckningen vinna vid konflikt', () => {
    const importen = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const older: PersonalCollections = {
      anteckningar: {
        'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'äldre', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-03T00:00:00.000Z' },
      },
      sparadeRum: {},
      sparadeVandringar: {},
      bookmarks: {},
      chapterBookmarks: {},
    }
    const ut = mergeImport(older, importen)
    expect(ut.anteckningar['rum-a']?.text).toBe('en tanke')

    const nyare: PersonalCollections = {
      ...older,
      anteckningar: {
        'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'nyare', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-20T00:00:00.000Z' },
      },
    }
    expect(mergeImport(nyare, importen).anteckningar['rum-a']?.text).toBe('nyare')
  })
})

describe('tillMarkdown', () => {
  it('speglar anteckningar och sparat i läsbar Markdown', () => {
    const md = toMarkdown(toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z'))
    expect(md).toContain('## rum:rum-a')
    expect(md).toContain('en tanke')
    expect(md).toContain('Skapad 2026-07-01T00:00:00.000Z')
    expect(md).toContain('updated 2026-07-05T00:00:00.000Z')
    expect(md).toContain('# Sparat')
    expect(md).toContain('- rum:rum-a')
  })
})
