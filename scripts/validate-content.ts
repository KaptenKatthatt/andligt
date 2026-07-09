// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// parsning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { parseRecordFile, parseRoomFile, type ParseResult, type RawFile } from '../src/content/editorial/parse'
import {
  pathSchema,
  personSchema,
  questionSchema,
  sourcePassageSchema,
  sourceSchema,
  themeSchema,
  traditionSchema,
  type ContentSet,
} from '../src/content/editorial/schema'
import { validateContent } from '../src/content/editorial/validate'

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content')

const readMarkdownFiles = (dirName: string): RawFile[] => {
  const dir = path.join(CONTENT_ROOT, dirName)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({
      path: `src/content/${dirName}/${name}`,
      raw: readFileSync(path.join(dir, name), 'utf-8'),
    }))
}

const allErrors: string[] = []

const collect = <T>(files: RawFile[], parse: (file: RawFile) => ParseResult<T>): T[] =>
  files.flatMap((file) => {
    const result = parse(file)
    allErrors.push(...result.errors)
    return result.value ? [result.value] : []
  })

const records = <T>(dirName: string, schema: z.ZodType<T>): T[] =>
  collect(readMarkdownFiles(dirName), (file) => parseRecordFile(schema, file))

const set: ContentSet = {
  rooms: collect(readMarkdownFiles('rooms'), parseRoomFile),
  themes: records('themes', themeSchema),
  questions: records('questions', questionSchema),
  paths: records('paths', pathSchema),
  sources: records('sources', sourceSchema),
  passages: records('passages', sourcePassageSchema),
  traditions: records('traditions', traditionSchema),
  people: records('people', personSchema),
}

allErrors.push(...validateContent(set))

if (allErrors.length > 0) {
  console.error(`Innehållsvalidering: ${allErrors.length} fel\n`)
  for (const error of allErrors) console.error(`  ✗ ${error}`)
  process.exit(1)
}

const counts = Object.entries(set)
  .filter(([, items]) => items.length > 0)
  .map(([name, items]) => `${name} ${items.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${counts || 'inget innehåll ännu'})`)
