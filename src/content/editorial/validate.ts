// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid parsning; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
import type { ContentSet, Question, Room, Theme } from './schema'

type Lookup = {
  rooms: Map<string, Room>
  themes: Map<string, Theme>
  questions: Map<string, Question>
  sourceStatus: Map<string, string>
  passageIds: Set<string>
}

const byId = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((item) => [item.id, item]))

const duplicateErrors = (label: string, items: { id: string; slug?: string }[]): string[] => {
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenSlugs = new Set<string>()
  for (const item of items) {
    if (seenIds.has(item.id)) errors.push(`${label} ${item.id}: dubblett av id "${item.id}"`)
    seenIds.add(item.id)
    if (item.slug !== undefined) {
      if (seenSlugs.has(item.slug)) errors.push(`${label} ${item.id}: dubblett av slug "${item.slug}"`)
      seenSlugs.add(item.slug)
    }
  }
  return errors
}

const published = (status: string | undefined): boolean => status === 'published'

// En refererad post: finns den, och (för publicerade rum) är den publicerad?
type Ref = { label: string; id: string; exists: boolean; published: boolean }

const roomRefs = (room: Room, lookup: Lookup): Ref[] => {
  const question = (label: string, id: string): Ref => ({
    label,
    id,
    exists: lookup.questions.has(id),
    published: published(lookup.questions.get(id)?.status),
  })
  return [
    question('primär fråga', room.primaryQuestionId),
    ...(room.relatedQuestionIds ?? []).map((id) => question('relaterad fråga', id)),
    ...room.themeIds.map((id): Ref => ({
      label: 'tema',
      id,
      exists: lookup.themes.has(id),
      published: published(lookup.themes.get(id)?.status),
    })),
    ...room.sources.map((relation): Ref => ({
      label: 'källa',
      id: relation.sourceId,
      exists: lookup.sourceStatus.has(relation.sourceId),
      published: published(lookup.sourceStatus.get(relation.sourceId)),
    })),
    ...room.sources
      .filter((relation) => relation.passageId !== undefined)
      .map((relation): Ref => ({
        label: 'källpassage',
        id: relation.passageId ?? '',
        exists: lookup.passageIds.has(relation.passageId ?? ''),
        published: true,
      })),
  ]
}

const roomRelationErrors = (room: Room, lookup: Lookup): string[] =>
  roomRefs(room, lookup)
    .filter((ref) => !ref.exists)
    .map((ref) => `rum ${room.id}: ${ref.label} "${ref.id}" finns inte`)

// Publiceringskraven (source-and-context.md Publication Gate, room-schema.md).
const roomPublicationErrors = (room: Room, lookup: Lookup): string[] => {
  if (!published(room.status)) return []
  const gates = [
    ...(room.sources.some((relation) => relation.primary)
      ? []
      : [`rum ${room.id}: publicerat rum saknar primär källa`]),
    ...(room.readingTimeMinutes <= 10
      ? []
      : [`rum ${room.id}: lästid ${room.readingTimeMinutes} min utanför 1–10 för publicerat rum`]),
  ]
  const unpublished = roomRefs(room, lookup)
    .filter((ref) => ref.exists && !ref.published)
    .map((ref) => `rum ${room.id}: länkar opublicerad(t) ${ref.label} "${ref.id}"`)
  return [...gates, ...unpublished]
}

const themeErrors = (theme: Theme, lookup: Lookup): string[] => {
  if (theme.defaultRoomId === undefined) return []
  const room = lookup.rooms.get(theme.defaultRoomId)
  if (!room) return [`tema ${theme.id}: defaultrum "${theme.defaultRoomId}" finns inte`]
  const errors: string[] = []
  if (!room.themeIds.includes(theme.id))
    errors.push(`tema ${theme.id}: defaultrummet "${room.id}" tillhör inte temat`)
  if (published(theme.status) && !published(room.status))
    errors.push(`tema ${theme.id}: publicerat tema har opublicerat defaultrum "${room.id}"`)
  return errors
}

const questionErrors = (question: Question, lookup: Lookup): string[] => {
  const errors: string[] = []
  for (const themeId of question.themeIds)
    if (!lookup.themes.has(themeId)) errors.push(`fråga ${question.id}: tema "${themeId}" finns inte`)
  for (const relatedId of question.relatedQuestionIds ?? [])
    if (!lookup.questions.has(relatedId))
      errors.push(`fråga ${question.id}: relaterad fråga "${relatedId}" finns inte`)
  return errors
}

const pathErrors = (set: ContentSet, lookup: Lookup): string[] =>
  set.paths.flatMap((path) => {
    const errors: string[] = []
    if (!lookup.questions.has(path.centralQuestionId))
      errors.push(`vandring ${path.id}: central fråga "${path.centralQuestionId}" finns inte`)
    for (const roomId of path.roomIds) {
      const room = lookup.rooms.get(roomId)
      if (!room) errors.push(`vandring ${path.id}: rum "${roomId}" finns inte`)
      else if (published(path.status) && !published(room.status))
        errors.push(`vandring ${path.id}: publicerad vandring innehåller opublicerat rum "${roomId}"`)
    }
    return errors
  })

const passageErrors = (set: ContentSet, lookup: Lookup): string[] =>
  set.passages.flatMap((passage) =>
    lookup.sourceStatus.has(passage.sourceId)
      ? []
      : [`passage ${passage.id}: källa "${passage.sourceId}" finns inte`],
  )

/** Validerar relationer och publiceringskrav över hela innehållsmängden.
 * Tom lista = konsistent innehåll. */
export const validateContent = (set: ContentSet): string[] => {
  const lookup: Lookup = {
    rooms: byId(set.rooms),
    themes: byId(set.themes),
    questions: byId(set.questions),
    sourceStatus: new Map(set.sources.map((source) => [source.id, source.status])),
    passageIds: new Set(set.passages.map((passage) => passage.id)),
  }
  return [
    ...duplicateErrors('rum', set.rooms),
    ...duplicateErrors('tema', set.themes),
    ...duplicateErrors('fråga', set.questions),
    ...duplicateErrors('vandring', set.paths),
    ...duplicateErrors('källa', set.sources),
    ...duplicateErrors('passage', set.passages),
    ...duplicateErrors('tradition', set.traditions),
    ...duplicateErrors('person', set.people),
    ...set.rooms.flatMap((room) => roomRelationErrors(room, lookup)),
    ...set.rooms.flatMap((room) => roomPublicationErrors(room, lookup)),
    ...set.themes.flatMap((theme) => themeErrors(theme, lookup)),
    ...set.questions.flatMap((question) => questionErrors(question, lookup)),
    ...pathErrors(set, lookup),
    ...passageErrors(set, lookup),
  ]
}
