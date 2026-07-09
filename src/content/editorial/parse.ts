// Parsar redaktionella Markdown-filer: YAML-frontmatter mellan `---`-linjer,
// därefter brödtext. Rum delar upp kroppen i ##-sektioner (Öppning/Kärna/
// Historisk kontext); enkla poster (tema, fråga, källa …) låter kroppen bli
// beskrivning. Fel rapporteras med filsökväg så de går att åtgärda direkt.
import { parse as parseYaml } from 'yaml'
import type { z } from 'zod'
import { roomSchema, type Room } from './schema'

export type RawFile = { path: string; raw: string }
export type ParseResult<T> = { value: T | null; errors: string[] }

// Sektionsrubrik i markdown → fält på rummet. Okända rubriker är fel, så
// stavfel inte tyst sväljer text.
const ROOM_SECTIONS: Record<string, 'opening' | 'core' | 'historicalContext'> = {
  'Öppning': 'opening',
  'Kärna': 'core',
  'Historisk kontext': 'historicalContext',
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

type SplitFile = { frontmatter: Record<string, unknown>; body: string }

const splitFrontmatter = (file: RawFile): ParseResult<SplitFile> => {
  const match = FRONTMATTER.exec(file.raw)
  if (!match || match[1] === undefined || match[2] === undefined) {
    return { value: null, errors: [`${file.path}: saknar frontmatter (--- ... ---)`] }
  }
  let data: unknown
  try {
    data = parseYaml(match[1]) as unknown
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err)
    return { value: null, errors: [`${file.path}: ogiltig yaml i frontmatter — ${reason}`] }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { value: null, errors: [`${file.path}: frontmatter måste vara nyckel–värde-par`] }
  }
  return { value: { frontmatter: { ...data }, body: match[2] }, errors: [] }
}

const formatIssues = (path: string, issues: readonly z.core.$ZodIssue[]): string[] =>
  issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : '(rot)'
    return `${path}: ${field} — ${issue.message}`
  })

/** Delar en markdown-kropp i sektioner per `## Rubrik`. Text före första
 * rubriken ignoreras (används inte i rumsformatet). */
const splitSections = (body: string): Map<string, string> => {
  const sections = new Map<string, string>()
  let current: string | null = null
  let lines: string[] = []
  const flush = () => {
    if (current !== null) sections.set(current, lines.join('\n').trim())
  }
  for (const line of body.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading?.[1] !== undefined) {
      flush()
      current = heading[1]
      lines = []
    } else {
      lines.push(line)
    }
  }
  flush()
  return sections
}

const roomSectionFields = (
  path: string,
  body: string,
): ParseResult<Partial<Record<'opening' | 'core' | 'historicalContext', string>>> => {
  const errors: string[] = []
  const fields: Partial<Record<'opening' | 'core' | 'historicalContext', string>> = {}
  for (const [heading, text] of splitSections(body)) {
    const field = ROOM_SECTIONS[heading]
    if (!field) errors.push(`${path}: okänd sektion "## ${heading}"`)
    else if (text.length > 0) fields[field] = text
  }
  for (const required of ['Öppning', 'Kärna'] as const) {
    const field = ROOM_SECTIONS[required]
    if (field && fields[field] === undefined)
      errors.push(`${path}: saknar sektionen "## ${required}"`)
  }
  return errors.length > 0 ? { value: null, errors } : { value: fields, errors: [] }
}

/** Parsar och validerar ett rum (frontmatter + ##-sektioner). */
export const parseRoomFile = (file: RawFile): ParseResult<Room> => {
  const split = splitFrontmatter(file)
  if (!split.value) return { value: null, errors: split.errors }
  const sections = roomSectionFields(file.path, split.value.body)
  if (!sections.value) return { value: null, errors: sections.errors }
  const parsed = roomSchema.safeParse({ ...split.value.frontmatter, ...sections.value })
  if (!parsed.success) return { value: null, errors: formatIssues(file.path, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}

/** Parsar och validerar en enkel post (tema, fråga, källa, vandring …).
 * Brödtexten blir `description` när den inte är tom. */
export const parseRecordFile = <T>(schema: z.ZodType<T>, file: RawFile): ParseResult<T> => {
  const split = splitFrontmatter(file)
  if (!split.value) return { value: null, errors: split.errors }
  const body = split.value.body.trim()
  const candidate =
    body.length > 0 ? { ...split.value.frontmatter, description: body } : split.value.frontmatter
  const parsed = schema.safeParse(candidate)
  if (!parsed.success) return { value: null, errors: formatIssues(file.path, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}
