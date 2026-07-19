// Swedish text normalisation for search (search.md, Swedish Language Support).
// Pure logic with no dependencies. All folding here applies to MATCHING — never display;
// correct spelling is always preserved in what gets rendered (search.md, same section).

/** Folds text for matching: trim, lowercase and diacritic folding (å/ä→a, ö→o, é→e).
 * So `forlatelse` finds content about `förlåtelse` — a convenience, not a
 * replacement for correct language. */
export const normalize = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Normalised words from a text; splits on everything that isn't a letter/digit. */
export const wordList = (text: string): string[] =>
  normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)

// Common Swedish function words (normalised form) that carry little search intent.
// A query made up only of stopwords returns no hits (search.md, Query Behaviour).
const STOPWORDS = new Set([
  'och', 'att', 'som', 'det', 'en', 'ett', 'den', 'de', 'är', 'ar', 'var', 'med',
  'om', 'av', 'på', 'pa', 'för', 'for', 'till', 'i', 'du', 'jag', 'man', 'hur',
  'vad', 'när', 'nar', 'vem', 'varför', 'varfor', 'något', 'nagot', 'kan', 'ska',
])

/** The query's meaningful tokens: normalised words minus stopwords. */
export const searchTokens = (question: string): string[] =>
  wordList(question).filter((word) => !STOPWORDS.has(word))

// Common Swedish inflection suffixes, longest first so -orna is trimmed before -or before -a.
const SUFFIX = ['orna', 'arna', 'erna', 'or', 'ar', 'er', 'en', 'et', 'na', 'a', 's']

/** Conservative Swedish stem: trims a common inflection suffix when at least three
 * characters remain, so `fråga`/`frågor` match without short words collapsing. */
export const stem = (word: string): string => {
  for (const suffix of SUFFIX) {
    if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
      return word.slice(0, word.length - suffix.length)
    }
  }
  return word
}

// Exactly one character substitution at the same position (two equal-length words).
const differsByOneChar = (a: string, b: string): boolean => {
  let differences = 0
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) differences += 1
    if (differences > 1) return false
  }
  return differences === 1
}

// Exactly one transposition of two adjacent characters (two equal-length words).
const isTransposition = (a: string, b: string): boolean => {
  let first = -1
  let second = -1
  let count = 0
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === b[i]) continue
    count += 1
    if (count === 1) first = i
    else if (count === 2) second = i
    else return false
  }
  return (
    count === 2 &&
    second === first + 1 &&
    a[first] === b[second] &&
    a[second] === b[first]
  )
}

// `lang` becomes `kort` by removing exactly one character (length difference 1).
const isOneInsertion = (short: string, long: string): boolean => {
  let i = 0
  let skips = 0
  for (let j = 0; j < long.length; j += 1) {
    if (i < short.length && short[i] === long[j]) i += 1
    else skips += 1
    if (skips > 1) return false
  }
  return i === short.length
}

/** Conservative typo tolerance (search.md, Typo Tolerance): true when the words
 * differ by at most one typo (substitution, transposition, insertion/deletion) and both are
 * at least five characters — otherwise a single error could change the word's meaning. Equal words are
 * not a typo hit (they're caught as an exact match earlier in the chain). */
export const withinTypo = (a: string, b: string): boolean => {
  if (a.length < 5 || b.length < 5) return false
  const diff = a.length - b.length
  if (diff === 0) return differsByOneChar(a, b) || isTransposition(a, b)
  if (diff === 1) return isOneInsertion(b, a)
  if (diff === -1) return isOneInsertion(a, b)
  return false
}
