// Redaktionella innehållsmodeller (roadmap fas 2). Fältnamn och enum-värden
// följer specarnas TS-modeller (room-schema.md, source-and-context.md,
// paths.md, room-selection.md) så koden kan spåras rakt till dokumenten.
// Innehållet bor i Markdown med frontmatter under src/content/<typ>/.
import { z } from 'zod'

/** Publiceringsstatus — endast `published` får synas för läsare. */
const contentStatusSchema = z.enum(['draft', 'review', 'published', 'archived'])

// Sluggar är ascii-kebab (svenska ord skrivs utan åäö: "det-du-inte-kan-styra").
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ogiltig slug (ascii-kebab)')
const idSchema = z.string().min(1)
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'datum som ÅÅÅÅ-MM-DD')

/** Hur ett rum använder en källa (source-and-context.md, Types of Source Use). */
const sourceUsageSchema = z.enum([
  'quotation',
  'translation',
  'paraphrase',
  'adaptation',
  'inspiration',
  'synthesis',
  'historical-context',
])

/** Relation rum → källa; deklareras i rummets frontmatter under `sources:`. */
const roomSourceRelationSchema = z.object({
  sourceId: idSchema,
  passageId: idSchema.optional(),
  // Fritextreferens tills källpassager finns som egna poster, t.ex. "avsnitt 1".
  reference: z.string().min(1).optional(),
  usage: sourceUsageSchema,
  primary: z.boolean().default(false),
  editorialNote: z.string().optional(),
})

/** Redaktionellt ansvar (source-and-context.md, Editorial Responsibility). */
const editorialRecordSchema = z.object({
  writer: z.string().optional(),
  sourceReviewer: z.string().optional(),
  languageReviewer: z.string().optional(),
  reviewedAt: isoDateSchema.optional(),
  reviewNotes: z.string().optional(),
  version: z.number().int().min(1).default(1),
})

/** Ett reflektionsrum. `opening`/`core`/`historicalContext` fylls från
 * markdown-kroppens ##-sektioner av parsern, inte från frontmatter. */
export const roomSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryQuestionId: idSchema,
  themeIds: z.array(idSchema).min(1),
  thoughtToCarry: z.string().min(1),
  reflectionQuestions: z.array(z.string().min(1)).min(1).max(5),
  sources: z.array(roomSourceRelationSchema).min(1),
  readingTimeMinutes: z.number().int().min(1),
  language: z.string().default('sv'),
  status: contentStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  editorial: editorialRecordSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
  relatedQuestionIds: z.array(idSchema).optional(),
  opening: z.string().min(1),
  core: z.string().min(1),
  historicalContext: z.string().optional(),
})
export type Room = z.infer<typeof roomSchema>

/** Tema — bred mänsklig ingång på tröskeln (home-and-entry.md). Rummen äger
 * relationen via `themeIds`; temat pekar bara ut sitt redaktionella default. */
export const themeSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  label: z.string().min(1),
  defaultRoomId: idSchema.optional(),
  status: contentStatusSchema,
  description: z.string().optional(),
})
export type Theme = z.infer<typeof themeSchema>

/** Mänsklig fråga — taxonomins hjärta (question-taxonomy.md). */
export const questionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  text: z.string().min(1),
  themeIds: z.array(idSchema).min(1),
  relatedQuestionIds: z.array(idSchema).optional(),
  status: contentStatusSchema,
  description: z.string().optional(),
})
export type Question = z.infer<typeof questionSchema>

/** Vandring — kuraterad följd av rum (paths.md, Data Requirements). */
export const pathSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  introduction: z.string().min(1),
  centralQuestionId: idSchema,
  roomIds: z.array(idSchema).min(3).max(7),
  closingReflection: z.string().optional(),
  status: contentStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  editorialNotes: z.string().optional(),
})
export type Path = z.infer<typeof pathSchema>

/** Kanonisk källpost (source-and-context.md, Suggested Source Model). */
export const sourceSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  sourceType: z.enum([
    'book',
    'scripture',
    'letter',
    'speech',
    'poem',
    'inscription',
    'oral-tradition',
    'historical-document',
    'fragment',
    'other',
  ]),
  authorName: z.string().optional(),
  attributedAuthorName: z.string().optional(),
  traditionIds: z.array(idSchema).optional(),
  originalLanguage: z.string().optional(),
  approximateDate: z.string().optional(),
  place: z.string().optional(),
  authorshipStatus: z.enum(['known', 'attributed', 'disputed', 'unknown']).optional(),
  datingStatus: z.enum(['known', 'approximate', 'disputed', 'unknown']).optional(),
  copyrightStatus: z.enum(['public-domain', 'licensed', 'copyrighted', 'unknown']),
  // Verk i biblioteksdatabasen kopplas hit, så rum kan nå exakta verser.
  libraryWorkId: z.string().optional(),
  status: contentStatusSchema,
  description: z.string().optional(),
})
export type Source = z.infer<typeof sourceSchema>

/** Källpassage (source-and-context.md, Suggested Passage Model). */
export const sourcePassageSchema = z.object({
  id: idSchema,
  sourceId: idSchema,
  reference: z.string().min(1),
  originalText: z.string().optional(),
  translatedText: z.string().optional(),
  translator: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().optional(),
  sourceUrl: z.string().optional(),
  notes: z.string().optional(),
  status: contentStatusSchema,
})
export type SourcePassage = z.infer<typeof sourcePassageSchema>

/** Tradition — stödpost, aldrig primär navigation (library.md). */
export const traditionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  status: contentStatusSchema,
  description: z.string().optional(),
})
export type Tradition = z.infer<typeof traditionSchema>

/** Person — referenspunkt, inte ingång (library.md, People and Authors). */
export const personSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  years: z.string().optional(),
  traditionIds: z.array(idSchema).optional(),
  status: contentStatusSchema,
  description: z.string().optional(),
})
export type Person = z.infer<typeof personSchema>

/** Hela den redaktionella innehållsmängden, som korsvalideringen arbetar på. */
export type ContentSet = {
  rooms: Room[]
  themes: Theme[]
  questions: Question[]
  paths: Path[]
  sources: Source[]
  passages: SourcePassage[]
  traditions: Tradition[]
  people: Person[]
}
