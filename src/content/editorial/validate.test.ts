import { describe, expect, it } from 'vitest'
import type { Question, ContentSet, Source, SourcePassage, Room, Theme } from './schema'
import { validateContent } from './validate'

const rum = (över: Partial<Room> = {}): Room => ({
  id: 'rum-a',
  slug: 'rum-a',
  title: 'Rum A',
  summary: 'Sammanfattning.',
  primaryQuestion: 'fraga-a',
  themes: ['tema-a'],
  thoughtToCarry: 'En tanke.',
  reflectionQuestions: ['En fråga?'],
  sources: [{ source: 'kalla-a', use: 'bearbetning', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status: 'utkast',
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'Öppning.',
  core: 'Kärna.',
  ...över,
})

const tema = (över: Partial<Theme> = {}): Theme => ({
  id: 'tema-a',
  slug: 'tema-a',
  label: 'Tema A',
  status: 'publicerad',
  ...över,
})

const fråga = (över: Partial<Question> = {}): Question => ({
  id: 'fraga-a',
  slug: 'fraga-a',
  text: 'Vad är A?',
  themes: ['tema-a'],
  status: 'publicerad',
  ...över,
})

const source = (över: Partial<Source> = {}): Source => ({
  id: 'kalla-a',
  slug: 'kalla-a',
  title: 'Källa A',
  type: 'bok',
  attribution: 'känt',
  dating: 'känd',
  rights: 'public-domain',
  status: 'publicerad',
  ...över,
})

const passage = (över: Partial<SourcePassage> = {}): SourcePassage => ({
  id: 'passage-a',
  source: 'kalla-a',
  reference: 'avsnitt 1',
  status: 'publicerad',
  ...över,
})

const grund = (över: Partial<ContentSet> = {}): ContentSet => ({
  rum: [rum()],
  themes: [tema()],
  frågor: [fråga()],
  vandringar: [],
  sources: [source()],
  passager: [],
  traditions: [],
  personer: [],
  ...över,
})

describe('valideraInnehall', () => {
  it('godkänner en konsistent innehållsmängd', () => {
    expect(validateContent(grund())).toEqual([])
  })

  it('fångar dubblerade id och sluggar inom en samling', () => {
    const fel = validateContent(grund({ themes: [tema(), tema({ label: 'Kopia' })] }))
    expect(fel.some((f) => f.includes('tema-a') && f.includes('dubblett'))).toBe(true)
  })

  it('fångar rum vars primära fråga inte finns', () => {
    const fel = validateContent(grund({ rum: [rum({ primaryQuestion: 'saknas' })] }))
    expect(fel.some((f) => f.includes('rum-a') && f.includes('saknas'))).toBe(true)
  })

  it('fångar rum med okänt tema och okänd källa', () => {
    const fel = validateContent(
      grund({
        rum: [
          rum({
            themes: ['tema-x'],
            sources: [{ source: 'kalla-x', use: 'bearbetning', primary: true }],
          }),
        ],
      }),
    )
    expect(fel.some((f) => f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-x'))).toBe(true)
  })

  it('kräver primär källa för publicerade rum men inte för utkast', () => {
    const withoutPrimary = [{ source: 'kalla-a', use: 'bearbetning' as const, primary: false }]
    const draft = validateContent(grund({ rum: [rum({ sources: withoutPrimary })] }))
    expect(draft).toEqual([])
    const published = validateContent(
      grund({ rum: [rum({ status: 'publicerad', sources: withoutPrimary })] }),
    )
    expect(published.some((f) => f.includes('primary source'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerat innehåll', () => {
    const fel = validateContent(
      grund({
        rum: [rum({ status: 'publicerad' })],
        frågor: [fråga({ status: 'utkast' })],
        sources: [source({ status: 'granskning' })],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('opublicerad'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-a') && f.includes('opublicerad'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerade källpassager', () => {
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'citat' as const, primary: true },
    ]
    const passagen = {
      id: 'passage-a',
      source: 'kalla-a',
      reference: 'avsnitt 1',
      edition: 'George Long, 1877',
    }
    const draftPassage = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [{ ...passagen, status: 'utkast' }],
      }),
    )
    expect(
      draftPassage.some((f) => f.includes('passage-a') && f.includes('opublicerad')),
    ).toBe(true)
    const publishedPassage = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [{ ...passagen, status: 'publicerad' }],
      }),
    )
    expect(publishedPassage).toEqual([])
  })

  it('begränsar lästiden för publicerade rum till 1–10 minuter', () => {
    const fel = validateContent(
      grund({ rum: [rum({ status: 'publicerad', readingTimeMinutes: 12 })] }),
    )
    expect(fel.some((f) => f.includes('lästid'))).toBe(true)
    expect(validateContent(grund({ rum: [rum({ readingTimeMinutes: 12 })] }))).toEqual([])
  })

  it('kräver att temats standardrum finns och tillhör temat', () => {
    const unknown = validateContent(grund({ themes: [tema({ defaultRoom: 'rum-x' })] }))
    expect(unknown.some((f) => f.includes('rum-x'))).toBe(true)
    const errorTheme = validateContent(
      grund({
        themes: [tema(), tema({ id: 'tema-b', slug: 'tema-b', defaultRoom: 'rum-a' })],
      }),
    )
    expect(errorTheme.some((f) => f.includes('tema-b') && f.includes('tillhör'))).toBe(true)
  })

  it('kräver publicerat standardrum för publicerade teman', () => {
    const fel = validateContent(grund({ themes: [tema({ defaultRoom: 'rum-a' })] }))
    expect(fel.some((f) => f.includes('opublicer'))).toBe(true)
  })

  it('fångar brutna relationer från frågor, vandringar och passager', () => {
    const fel = validateContent(
      grund({
        frågor: [fråga({ themes: ['tema-x'], relatedQuestions: ['fraga-x'] })],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-x',
            rum: ['rum-a', 'rum-x', 'rum-y'],
            status: 'utkast',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
        passager: [
          { id: 'passage-a', source: 'kalla-x', reference: 'avsnitt 1', status: 'utkast' },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('fraga-x'))).toBe(true)
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('rum-x'))).toBe(true)
    expect(fel.some((f) => f.includes('passage-a') && f.includes('kalla-x'))).toBe(true)
  })

  it('hindrar publicerade frågor från att länka opublicerade teman och frågor', () => {
    // Frågan är publicerad men temat den pekar på (tema-a) är utkast.
    const unpublishedTheme = validateContent(
      grund({
        rum: [rum({ themes: ['tema-b'] })],
        themes: [tema({ status: 'utkast' }), tema({ id: 'tema-b', slug: 'tema-b' })],
      }),
    )
    expect(
      unpublishedTheme.some((f) => f.includes('fraga-a') && f.includes('opublicerad(t) tema')),
    ).toBe(true)
    const unpublishedRelaterad = validateContent(
      grund({
        frågor: [
          fråga({ relatedQuestions: ['fraga-b'] }),
          fråga({ id: 'fraga-b', slug: 'fraga-b', status: 'utkast' }),
        ],
      }),
    )
    expect(
      unpublishedRelaterad.some(
        (f) => f.includes('fraga-a') && f.includes('opublicerad(t) relaterad fråga'),
      ),
    ).toBe(true)
    // Utkastfrågor är fria att peka på opublicerat.
    const draftQuestion = validateContent(
      grund({
        rum: [rum({ themes: ['tema-a'], primaryQuestion: 'fraga-a' })],
        themes: [tema(), tema({ id: 'tema-b', slug: 'tema-b', status: 'utkast' })],
        frågor: [fråga({ status: 'utkast', themes: ['tema-b'] })],
      }),
    )
    expect(draftQuestion).toEqual([])
  })

  it('kräver att källors traditioner finns och hindrar publicerad källa från att länka opublicerad tradition', () => {
    const traditionen = { id: 'tradition-a', slug: 'tradition-a', name: 'Tradition A' }
    const unknown = validateContent(
      grund({ sources: [source({ traditions: ['tradition-x'] })] }),
    )
    expect(unknown.some((f) => f.includes('kalla-a') && f.includes('tradition-x'))).toBe(true)
    const unpublished = validateContent(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'utkast' }],
      }),
    )
    expect(
      unpublished.some((f) => f.includes('kalla-a') && f.includes('opublicerad tradition')),
    ).toBe(true)
    const publicerad = validateContent(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'publicerad' }],
      }),
    )
    expect(publicerad).toEqual([])
    // Utkastkällor är fria — grinden gäller bara publicerat.
    const draftSource = validateContent(
      grund({
        rum: [rum({ sources: [{ source: 'kalla-b', use: 'bearbetning', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'utkast', traditions: ['tradition-a'] }),
        ],
        traditions: [{ ...traditionen, status: 'utkast' }],
      }),
    )
    expect(draftSource).toEqual([])
  })

  it('hindrar publicerade vandringar från att innehålla opublicerade rum', () => {
    const fel = validateContent(
      grund({
        rum: [rum(), rum({ id: 'rum-b', slug: 'rum-b' }), rum({ id: 'rum-c', slug: 'rum-c' })],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-a',
            rum: ['rum-a', 'rum-b', 'rum-c'],
            status: 'publicerad',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('opublicer'))).toBe(true)
  })

  it('kräver källpassage med utgåva för citat och översättning i publicerade rum', () => {
    const withoutPassage = [{ source: 'kalla-a', use: 'citat' as const, primary: true }]
    // Utkast får sakna passage — grinden gäller bara publicerat.
    expect(validateContent(grund({ rum: [rum({ sources: withoutPassage })] }))).toEqual([])
    const publishedWithout = validateContent(
      grund({ rum: [rum({ status: 'publicerad', sources: withoutPassage })] }),
    )
    expect(publishedWithout.some((f) => f.includes('citat') && f.includes('källpassage'))).toBe(true)
    // Passage utan edition räcker inte.
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'citat' as const, primary: true },
    ]
    const withoutUtgava = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [passage()],
      }),
    )
    expect(withoutUtgava.some((f) => f.includes('citat') && f.includes('edition'))).toBe(true)
    // Med reference + edition passerar citatet.
    const komplett = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [passage({ edition: 'George Long, 1877' })],
      }),
    )
    expect(komplett).toEqual([])
  })

  it('kräver angiven översättare för egen översättning', () => {
    const relation = [
      { source: 'kalla-a', passage: 'passage-a', use: 'översättning' as const, primary: true },
    ]
    const withoutTranslator = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: relation })],
        passager: [passage({ edition: 'Grekiska (public domain)' })],
      }),
    )
    expect(
      withoutTranslator.some((f) => f.includes('översättning') && f.includes('översättare')),
    ).toBe(true)
    const withTranslator = validateContent(
      grund({
        rum: [rum({ status: 'publicerad', sources: relation })],
        passager: [passage({ edition: 'Grekiska (public domain)', translator: 'Redaktionen' })],
      }),
    )
    expect(withTranslator).toEqual([])
  })

  it('kräver upphovs- och dateringsstatus för publicerade källor', () => {
    const without = validateContent(
      grund({ sources: [source({ attribution: undefined, dating: undefined })] }),
    )
    expect(without.some((f) => f.includes('kalla-a') && f.includes('attribution'))).toBe(true)
    expect(without.some((f) => f.includes('kalla-a') && f.includes('dating'))).toBe(true)
    // Utkastkällor slipper grinden.
    const draft = validateContent(
      grund({
        rum: [rum({ sources: [{ source: 'kalla-b', use: 'bearbetning', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'utkast', attribution: undefined, dating: undefined }),
        ],
      }),
    )
    expect(draft).toEqual([])
  })

  it('hindrar publicerade vandringar från att länka en opublicerad central fråga', () => {
    const fel = validateContent(
      grund({
        // fraga-b är utkast och central; rummen är publicerade så bara den
        // centrala frågan bryter grinden.
        frågor: [fråga(), fråga({ id: 'fraga-b', slug: 'fraga-b', status: 'utkast' })],
        rum: [
          rum({ status: 'publicerad' }),
          rum({ id: 'rum-b', slug: 'rum-b', status: 'publicerad' }),
          rum({ id: 'rum-c', slug: 'rum-c', status: 'publicerad' }),
        ],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-b',
            rum: ['rum-a', 'rum-b', 'rum-c'],
            status: 'publicerad',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('central fråga'))).toBe(true)
  })
})
