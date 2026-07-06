import { mapPool } from '../../lib/concurrency'
import { translateMany } from '../translate'
import type { NormalizedVerse } from '../model'

// En rå vers innan översättning: dess nummer, källtext (engelska/pali …) och
// valfri originaltext att bevara vid sidan av den svenska översättningen.
export type RawVerse = { verse: number; source: string; orig?: string }
export type RawChapter = { chapter: number; verses: RawVerse[] }

export type BuiltVerses = { verses: NormalizedVerse[]; translated: boolean }

// Översätt varje kapitels verser till svenska och bygg NormalizedVerse[].
// Delas av alla översatta verk (Dhammapada, Självbetraktelser, Tao Te Ching).
// Verket räknas som översatt bara om varje kapitel översattes fullt ut.
export const translateChapters = async (
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
  return {
    verses: built.flatMap((b) => b.verses),
    translated: built.length > 0 && built.every((b) => b.translated),
  }
}
