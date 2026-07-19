// Private notes search (search.md, Notes Search): an entirely separate path. Searches ONLY
// the current user's notes and shares nothing with the public
// index — it never imports sokindex/soklogik, so no note text
// can affect or leak into public results (Phase 9 Privacy/AI Access).
import type { Note } from './personal'
import { wordList, searchTokens } from './searchNormalize'

// All meaningful words must occur in the note (AND), as an exact word,
// prefix or — for longer words — substring. The same Swedish normalisation as
// the public search, but without synonyms/ranking: private text should be found, not weighted.
const matchar = (tokens: string[], text: string): boolean => {
  const word = wordList(text)
  return tokens.every((token) =>
    word.some(
      (o) => o === token || o.startsWith(token) || (token.length >= 4 && o.includes(token)),
    ),
  )
}

/** Searches the user's notes, most recently changed first. Empty notes and
 * queries shorter than two meaningful characters return nothing. */
export const searchNotes = (
  question: string,
  notes: Record<string, Note>,
): Note[] => {
  if (wordList(question).join(' ').length < 2) return []
  const tokens = searchTokens(question)
  if (tokens.length === 0) return []
  return Object.values(notes)
    .filter((note) => note.text.trim().length > 0)
    .filter((note) => matchar(tokens, note.text))
    .sort((a, b) => b.updated.localeCompare(a.updated))
}
