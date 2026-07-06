import { fetchText } from '../../lib/fetchText'
import { translateChapters, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Marcus Aurelius Självbetraktelser, George Longs engelska översättning (public
// domain) via Project Gutenberg. Tolv böcker med romerskt numrerade sektioner;
// varje bok blir ett kapitel, varje sektion en vers. Översätts till svenska.
const URL = 'https://raw.githubusercontent.com/GITenberg/Meditations_2680/master/2680.txt'
const ORDINALS = 'FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH'
const HEADER = new RegExp(`^THE (?:${ORDINALS}) BOOK\\s*$`, 'm')

const parseSections = (chunk: string): string[] =>
  chunk
    .split(/\n\s*\n(?=[IVXLC]+\.\s)/)
    .map((s) => s.trim())
    .filter((s) => /^[IVXLC]+\.\s/.test(s))
    .map((s) => s.replace(/^[IVXLC]+\.\s*/, '').replace(/\s+/g, ' ').trim())

const parseMeditations = (raw: string): RawChapter[] => {
  const text = raw.replace(/\r/g, '')
  const start = text.indexOf('THE FIRST BOOK')
  const end = text.indexOf('*** END OF')
  const body = text.slice(start < 0 ? 0 : start, end < 0 ? text.length : end)
  return body
    .split(HEADER)
    .slice(1)
    .map((chunk, i) => ({
      chapter: i + 1,
      verses: parseSections(chunk).map((source, j) => ({ verse: j + 1, source, orig: source })),
    }))
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'sjalvbetraktelser',
  title: 'Självbetraktelser',
  subtitle: 'Till sig själv',
  tradition: 'Stoicism',
  author: 'Marcus Aurelius',
  lang: 'Grekiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från George Longs engelska'
    : 'Engelska: George Long',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/2680',
  translated,
})

export const gutenbergMeditations = async (): Promise<NormalizedWork> => {
  const chapters = parseMeditations(await fetchText(URL))
  const { verses, translated } = await translateChapters(chapters, 3)
  const book = { slug: 'sjalvbetraktelser', name: 'Självbetraktelser', abbrev: 'Självbetr.', verses }
  return { meta: metaFor(translated), books: [book] }
}
