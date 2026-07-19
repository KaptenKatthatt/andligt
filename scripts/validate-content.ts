// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// tolkning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { parsePostFile, parseRoomFile, type ContentFile, type Parsed } from '../src/content/editorial/parse'
import {
  questionSchema,
  sourceSchema,
  sourcePassageSchema,
  personSchema,
  themeSchema,
  traditionSchema,
  pathSchema,
  type ContentSet,
} from '../src/content/editorial/schema'
import { validateContent } from '../src/content/editorial/validate'

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content')

const readMarkdownFiles = (directory: string): ContentFile[] => {
  const dir = path.join(CONTENT_ROOT, directory)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({
      filePath: `src/content/${directory}/${name}`,
      rawText: readFileSync(path.join(dir, name), 'utf-8'),
    }))
}

const allErrors: string[] = []

const collect = <T>(files: ContentFile[], parse: (file: ContentFile) => Parsed<T>): T[] =>
  files.flatMap((file) => {
    const parsed = parse(file)
    allErrors.push(...parsed.errors)
    return parsed.value ? [parsed.value] : []
  })

const records = <T>(directory: string, schema: z.ZodType<T>): T[] =>
  collect(readMarkdownFiles(directory), (file) => parsePostFile(schema, file))

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

const count = Object.entries(set)
  .filter(([, records]) => records.length > 0)
  .map(([name, records]) => `${name} ${records.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${count || 'inget innehåll ännu'})`)
