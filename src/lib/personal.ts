// Personlig data (notes-and-saved.md): sparade platser och anteckningar.
// Ren logik utan React eller localStorage — migrering, sortering och etiketter
// bor här så store.tsx bara kopplar ihop och allt kan enhetstestas som rumsval.ts.
// Anteckningar är privata: de påverkar aldrig rumsvalet, publik sök, AI eller
// analytics (spec Privacy/AI Access).

/** Ett kapitelbokmärke i verkläsaren: pekar på ett kapitel och bär boknamnet
 * så Sparat kan rendera raden utan ett extra API-anrop. */
export type ChapterBookmark = {
  workId: string
  bookSlug: string
  chapter: number
  bookName: string
  savedAt: number
}

/** Nyckel för ett kapitelbokmärke — samma form som bok-id:t plus kapitel. */
export const chapterKey = (workId: string, bookSlug: string, chapter: number): string =>
  `${workId}/${bookSlug}:${chapter}`

/** En sparad post bär bara när den sparades. `null` = migrerad från gammal
 * boolean utan känt datum; datumet är valfritt i preview-kortet. */
export type SavedItem = { savedWhen: string | null }

/** Var en anteckning hör hemma. `topic` = kvarvarande topic-poster ur gamla
 * appen; utökas senare med `question`/`source` när de blir sparbara. */
export type Origin = 'room' | 'path' | 'topic'

/** En anteckning kopplad till sitt ursprung. Nyckeln i store = originId
 * (en anteckning per place — dagens UX). ISO 8601-datum, läsbara i exporten. */
export type Note = {
  originType: Origin
  originId: string
  text: string
  created: string
  updated: string
}

const isRecord = (värde: unknown): värde is Record<string, unknown> =>
  typeof värde === 'object' && värde !== null && !Array.isArray(värde)

// Kanoniska ursprungsvärden plus de svenska värden en tidigare version lagrade,
// normaliserade till de nya vid inläsning så en uppgradering aldrig tappar ursprung.
const ORIGIN_ALIAS: Record<string, Origin> = {
  room: 'room',
  path: 'path',
  topic: 'topic',
  rum: 'room',
  vandring: 'path',
  amne: 'topic',
}

const toOrigin = (värde: unknown): Origin | undefined =>
  typeof värde === 'string' ? ORIGIN_ALIAS[värde] : undefined

// En sparad post ur okänd lagring: gammal `true` → migrerad utan datum, gammal
// `false` släpps, redan migrerad `{ savedWhen }` passerar orörd (den svenska
// nyckeln `sparadNar` läses som fallback). Allt annat släpps.
const migrateSavedItem = (värde: unknown): SavedItem | null => {
  if (värde === true) return { savedWhen: null }
  if (isRecord(värde)) {
    const savedWhen = 'savedWhen' in värde ? värde.savedWhen : värde.sparadNar
    if (savedWhen === null || typeof savedWhen === 'string') return { savedWhen }
  }
  return null
}

/** Migrerar ett sparat-record (rum eller vandringar) tyst och förlustfritt.
 * Idempotent: redan migrerad form går igenom oförändrad. Kastar aldrig. */
export const migrateSaved = (rått: unknown): Record<string, SavedItem> => {
  const ut: Record<string, SavedItem> = {}
  if (!isRecord(rått)) return ut
  for (const [id, värde] of Object.entries(rått)) {
    const post = migrateSavedItem(värde)
    if (post) ut[id] = post
  }
  return ut
}

// En redan migrerad anteckning ur okänd lagring, defensivt narrowad. Fält som
// saknas eller är korrupta får trygga fallbacks — texten bevaras alltid.
const migrateNoteItem = (id: string, värde: unknown, nu: string): Note | null => {
  if (!isRecord(värde)) return null
  // Äldre lagrade anteckningar bär de svenska tidsstämpelnycklarna `skapad`/
  // `uppdaterad`; läs dem som fallback så en uppgradering aldrig nollställer
  // kronologin (anteckningsvyn sorterar på `updated`, importkonflikter avgörs på det).
  // Nya nycklar först, de svenska (originType/originId hette ursprungTyp/ursprungId)
  // som fallback så en uppgradering aldrig tappar en anteckning.
  const { originType, originId, ursprungTyp, ursprungId, text, created, updated, skapad, uppdaterad } =
    värde
  if (typeof text !== 'string' || text.trim().length === 0) return null
  const förstSträng = (a: unknown, b: unknown): string =>
    typeof a === 'string' ? a : typeof b === 'string' ? b : nu
  return {
    originType: toOrigin(originType) ?? toOrigin(ursprungTyp) ?? 'topic',
    originId:
      typeof originId === 'string' ? originId : typeof ursprungId === 'string' ? ursprungId : id,
    text,
    created: förstSträng(created, skapad),
    updated: förstSträng(updated, uppdaterad),
  }
}

// Gamla `notes` (id→text) → ursprungskopplade poster; tomma prunas.
const itemsFromGamlaNotes = (
  gamlaNotes: unknown,
  klassificera: (id: string) => Origin,
  nu: string,
): Record<string, Note> => {
  const ut: Record<string, Note> = {}
  if (!isRecord(gamlaNotes)) return ut
  for (const [id, värde] of Object.entries(gamlaNotes)) {
    if (typeof värde !== 'string' || värde.trim().length === 0) continue
    ut[id] = { originType: klassificera(id), originId: id, text: värde, created: nu, updated: nu }
  }
  return ut
}

// Redan migrerade poster ur okänd lagring, defensivt narrowade.
const itemsFromMigrerade = (nyaAnteckningar: unknown, nu: string): Record<string, Note> => {
  const ut: Record<string, Note> = {}
  if (!isRecord(nyaAnteckningar)) return ut
  for (const [id, värde] of Object.entries(nyaAnteckningar)) {
    const post = migrateNoteItem(id, värde, nu)
    if (post) ut[id] = post
  }
  return ut
}

/** Migrerar anteckningar tyst och förlustfritt: gamla `notes` (id→text) blir
 * ursprungskopplade poster via `klassificera`, redan migrerade poster vinner
 * (spridningsordningen). Tomma anteckningar prunas. Kastar aldrig — privat data
 * får aldrig gå förlorad vid en uppgradering. */
export const migrateNotes = (
  gamlaNotes: unknown,
  nyaAnteckningar: unknown,
  klassificera: (id: string) => Origin,
  nu: string,
): Record<string, Note> => ({
  ...itemsFromGamlaNotes(gamlaNotes, klassificera, nu),
  ...itemsFromMigrerade(nyaAnteckningar, nu),
})

/** Bygger anteckningens nya tillstånd vid en skrivning: `created` bevaras från
 * den befintliga posten (autospar utan synlig versionshistorik), `updated`
 * flyttas fram. */
export const updatedNote = (
  befintlig: Note | undefined,
  type: Origin,
  id: string,
  text: string,
  nu: string,
): Note => ({
  originType: type,
  originId: id,
  text,
  created: befintlig?.created ?? nu,
  updated: nu,
})

/** Sparade poster i tidsordning: senast sparat först. Migrerade poster utan
 * datum (`sparadNar === null`) sorteras sist via tom nyckel. */
export const savedIdsByTime = (poster: Record<string, SavedItem>): string[] => {
  const nyckel = (id: string): string => poster[id]?.savedWhen ?? ''
  return Object.keys(poster).sort((a, b) => nyckel(b).localeCompare(nyckel(a)))
}

/** Anteckningsöversiktens order: senast ändrad först, tomma utelämnade
 * (spec Notes Overview: lugnt kronologisk). ISO 8601 jämförs lexikalt. */
export const sortedNotes = (anteckningar: Record<string, Note>): Note[] =>
  Object.values(anteckningar)
    .filter((anteckning) => anteckning.text.trim().length > 0)
    .sort((a, b) => b.updated.localeCompare(a.updated))

/** Kort utdrag för preview-kort; klipper generöst och osynligt (spec Note Length). */
export const utdrag = (text: string, max = 72): string => {
  const rensad = text.trim()
  return rensad.length > max ? `${rensad.slice(0, max)}…` : rensad
}

/** Stilla svenskt datum för »sparad«-raden, eller inget vid okänt/ogiltigt datum. */
export const dateLabel = (iso: string | null): string | undefined => {
  if (!iso) return undefined
  const tid = new Date(iso)
  if (Number.isNaN(tid.getTime())) return undefined
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }).format(tid)
}
