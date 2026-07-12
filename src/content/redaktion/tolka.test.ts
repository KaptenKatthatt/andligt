import { describe, expect, it } from 'vitest'
import { tolkaPostfil, tolkaRumsfil } from './tolka'
import { temaSchema } from './schema'

const rumsMarkdown = `---
id: rum-det-du-inte-kan-styra
slug: det-du-inte-kan-styra
titel: Det du inte kan styra
sammanfattning: En tanke om skillnaden mellan det som beror på dig och det som inte gör det.
primärFråga: fraga-vad-kan-du-styra
teman: [tema-lugn]
tankeAttBära: Det som inte beror på dig behöver inte bäras av dig.
reflektionsfrågor:
  - Vad händer när du försöker styra det som ligger utanför din makt?
källor:
  - källa: kalla-enchiridion
    referens: avsnitt 1
    bruk: bearbetning
    primär: true
lästidMinuter: 4
status: utkast
skapad: 2026-07-09
uppdaterad: 2026-07-09
---

## Öppning

Några meningar som öppnar rummet.

## Kärna

Själva kärntexten, flera stycken lång.

## Historisk kontext

Valfri bakgrund.
`

describe('tolkaRumsfil', () => {
  it('tolkar frontmatter och sektioner till ett validerat rum', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/det-du-inte-kan-styra.md', råtext: rumsMarkdown })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.id).toBe('rum-det-du-inte-kan-styra')
    expect(tolkning.värde?.öppning).toContain('öppnar rummet')
    expect(tolkning.värde?.kärna).toContain('kärntexten')
    expect(tolkning.värde?.historiskKontext).toContain('Valfri bakgrund')
    expect(tolkning.värde?.språk).toBe('sv')
    expect(tolkning.värde?.källor[0]?.primär).toBe(true)
  })

  it('felar med sökväg och sektionsnamn när obligatoriskt saknas', () => {
    const utanKarna = rumsMarkdown.replace(/## Kärna[\s\S]*?(?=## Historisk)/, '')
    const tolkning = tolkaRumsfil({ sökväg: 'rum/trasig.md', råtext: utanKarna })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.some((f) => f.includes('rum/trasig.md') && f.includes('Kärna'))).toBe(true)
  })

  it('felar begripligt på trasig frontmatter-yaml', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/yaml.md', råtext: '---\n: [ogiltig\n---\ntext' })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.length).toBeGreaterThan(0)
  })

  it('felar när frontmatter-avgränsare saknas', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/naken.md', råtext: 'bara text utan frontmatter' })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel[0]).toContain('frontmatter')
  })
})

describe('tolkaPostfil', () => {
  it('tolkar frontmatter och låter kroppen bli beskrivning', () => {
    const råtext = `---
id: tema-lugn
slug: lugn
etikett: Lugn
status: utkast
---

Om det som stillnar när ingenting kräver något.
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'teman/lugn.md', råtext })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.etikett).toBe('Lugn')
    expect(tolkning.värde?.beskrivning).toContain('stillnar')
  })

  it('lämnar beskrivningen tom när kroppen är tom', () => {
    const råtext = `---
id: tema-lugn
slug: lugn
etikett: Lugn
status: utkast
---
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'teman/lugn.md', råtext })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.beskrivning).toBeUndefined()
  })

  it('samlar zod-fel med fältväg', () => {
    const råtext = `---
id: tema-lugn
slug: Lugn Med Mellanslag
etikett: Lugn
status: hemlig
---
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'teman/lugn.md', råtext })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.some((f) => f.includes('slug'))).toBe(true)
    expect(tolkning.fel.some((f) => f.includes('status'))).toBe(true)
  })
})
