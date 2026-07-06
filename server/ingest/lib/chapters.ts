import { mapPool } from '../../lib/concurrency'
import { translateMany } from '../translate'
import type { NormalizedVerse, NormalizedWork, WorkMeta } from '../model'

// En rå vers innan översättning: dess nummer, källtext (engelska/pali …) och
// valfri originaltext att bevara vid sidan av den svenska översättningen.
type RawVerse = { verse: number; source: string; orig?: string }
export type RawChapter = { chapter: number; verses: RawVerse[] }

type BuiltVerses = { verses: NormalizedVerse[]; translated: boolean }

// Översätt varje kapitels verser till svenska och bygg NormalizedVerse[].
// Verket räknas som översatt bara om varje *icke-tomt* kapitel översattes fullt
// ut (ett tomt kapitel ska inte dra ner flaggan).
const translateChapters = async (
  chapters: RawChapter[],
  concurrency = 4,
): Promise<BuiltVerses> => {
  const built = await mapPool(chapters, concurrency, async (ch) => {
    const { lines, translated } = await translateMany(ch.verses.map((v) => v.source))
    const verses = ch.verses.map((v, i) => ({
      chapter: ch.chapter,
      verse: v.verse,
      text: lines[i] ?? v.source,
      origText: v.orig,
    }))
    return { verses, translated }
  })
  const withVerses = built.filter((b) => b.verses.length > 0)
  return {
    verses: built.flatMap((b) => b.verses),
    translated: withVerses.length > 0 && withVerses.every((b) => b.translated),
  }
}

type BookInfo = { slug: string; name: string; abbrev: string }

/** Översätter råkapitel och sätter ihop ett ett-bok-verk (delas av adaptrarna). */
export const buildTranslatedWork = async (
  chapters: RawChapter[],
  book: BookInfo,
  metaFor: (translated: boolean) => WorkMeta,
  concurrency = 4,
): Promise<NormalizedWork> => {
  const { verses, translated } = await translateChapters(chapters, concurrency)
  return { meta: metaFor(translated), books: [{ ...book, verses }] }
}
