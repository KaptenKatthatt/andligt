import { describe, expect, it } from 'vitest'
import { parseRoomFile, parseRecordFile } from './parse'
import { themeSchema } from './schema'

const roomMarkdown = `---
id: room-det-du-inte-kan-styra
slug: det-du-inte-kan-styra
title: Det du inte kan styra
summary: En tanke om skillnaden mellan det som beror på dig och det som inte gör det.
primaryQuestionId: fraga-vad-kan-du-styra
themeIds: [tema-lugn]
thoughtToCarry: Det som inte beror på dig behöver inte bäras av dig.
reflectionQuestions:
  - Vad händer när du försöker styra det som ligger utanför din makt?
sources:
  - sourceId: kalla-enchiridion
    reference: avsnitt 1
    usage: adaptation
    primary: true
readingTimeMinutes: 4
status: draft
createdAt: 2026-07-09
updatedAt: 2026-07-09
---

## Öppning

Några meningar som öppnar rummet.

## Kärna

Själva kärntexten, flera stycken lång.

## Historisk kontext

Valfri bakgrund.
`

describe('parseRoomFile', () => {
  it('parsar frontmatter och sektioner till ett validerat rum', () => {
    const result = parseRoomFile({ path: 'rooms/det-du-inte-kan-styra.md', raw: roomMarkdown })
    expect(result.errors).toEqual([])
    expect(result.value?.id).toBe('room-det-du-inte-kan-styra')
    expect(result.value?.opening).toContain('öppnar rummet')
    expect(result.value?.core).toContain('kärntexten')
    expect(result.value?.historicalContext).toContain('Valfri bakgrund')
    expect(result.value?.language).toBe('sv')
    expect(result.value?.sources[0]?.primary).toBe(true)
  })

  it('felar med sökväg och fältnamn när obligatoriskt saknas', () => {
    const utanKarna = roomMarkdown.replace(/## Kärna[\s\S]*?(?=## Historisk)/, '')
    const result = parseRoomFile({ path: 'rooms/trasig.md', raw: utanKarna })
    expect(result.value).toBeNull()
    expect(result.errors.some((e) => e.includes('rooms/trasig.md') && e.includes('Kärna'))).toBe(
      true,
    )
  })

  it('felar begripligt på trasig frontmatter-yaml', () => {
    const result = parseRoomFile({ path: 'rooms/yaml.md', raw: '---\n: [ogiltig\n---\ntext' })
    expect(result.value).toBeNull()
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('felar när frontmatter-avgränsare saknas', () => {
    const result = parseRoomFile({ path: 'rooms/naken.md', raw: 'bara text utan frontmatter' })
    expect(result.value).toBeNull()
    expect(result.errors[0]).toContain('frontmatter')
  })
})

describe('parseRecordFile', () => {
  it('parsar frontmatter och låter kroppen bli beskrivning', () => {
    const raw = `---
id: tema-lugn
slug: lugn
label: Lugn
status: draft
---

Om det som stillnar när ingenting kräver något.
`
    const result = parseRecordFile(themeSchema, { path: 'themes/lugn.md', raw })
    expect(result.errors).toEqual([])
    expect(result.value?.label).toBe('Lugn')
    expect(result.value?.description).toContain('stillnar')
  })

  it('lämnar beskrivningen tom när kroppen är tom', () => {
    const raw = `---
id: tema-lugn
slug: lugn
label: Lugn
status: draft
---
`
    const result = parseRecordFile(themeSchema, { path: 'themes/lugn.md', raw })
    expect(result.errors).toEqual([])
    expect(result.value?.description).toBeUndefined()
  })

  it('samlar zod-fel med fältväg', () => {
    const raw = `---
id: tema-lugn
slug: Lugn Med Mellanslag
label: Lugn
status: hemlig
---
`
    const result = parseRecordFile(themeSchema, { path: 'themes/lugn.md', raw })
    expect(result.value).toBeNull()
    expect(result.errors.some((e) => e.includes('slug'))).toBe(true)
    expect(result.errors.some((e) => e.includes('status'))).toBe(true)
  })
})
