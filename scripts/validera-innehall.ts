// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// tolkning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { tolkaPostfil, tolkaRumsfil, type Innehallsfil, type Tolkning } from '../src/content/redaktion/tolka'
import {
  fragaSchema,
  kallaSchema,
  kallpassageSchema,
  personSchema,
  temaSchema,
  traditionSchema,
  vandringSchema,
  type Innehallsmangd,
} from '../src/content/redaktion/schema'
import { valideraInnehall } from '../src/content/redaktion/validera'

const INNEHALLSROT = path.join(process.cwd(), 'src', 'content')

const läsMarkdownfiler = (katalog: string): Innehallsfil[] => {
  const dir = path.join(INNEHALLSROT, katalog)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((namn) => namn.endsWith('.md'))
    .sort()
    .map((namn) => ({
      sökväg: `src/content/${katalog}/${namn}`,
      råtext: readFileSync(path.join(dir, namn), 'utf-8'),
    }))
}

const allaFel: string[] = []

const samla = <T>(filer: Innehallsfil[], tolka: (fil: Innehallsfil) => Tolkning<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    allaFel.push(...tolkning.fel)
    return tolkning.värde ? [tolkning.värde] : []
  })

const poster = <T>(katalog: string, schema: z.ZodType<T>): T[] =>
  samla(läsMarkdownfiler(katalog), (fil) => tolkaPostfil(schema, fil))

const mängd: Innehallsmangd = {
  rum: samla(läsMarkdownfiler('rum'), tolkaRumsfil),
  teman: poster('teman', temaSchema),
  frågor: poster('fragor', fragaSchema),
  vandringar: poster('vandringar', vandringSchema),
  källor: poster('kallor', kallaSchema),
  passager: poster('passager', kallpassageSchema),
  traditioner: poster('traditioner', traditionSchema),
  personer: poster('personer', personSchema),
}

allaFel.push(...valideraInnehall(mängd))

if (allaFel.length > 0) {
  console.error(`Innehållsvalidering: ${allaFel.length} fel\n`)
  for (const fel of allaFel) console.error(`  ✗ ${fel}`)
  process.exit(1)
}

const antal = Object.entries(mängd)
  .filter(([, poster]) => poster.length > 0)
  .map(([namn, poster]) => `${namn} ${poster.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${antal || 'inget innehåll ännu'})`)
