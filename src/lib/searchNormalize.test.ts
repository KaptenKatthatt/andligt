import { describe, expect, it } from 'vitest'
import { withinTypo, normalize, wordList, searchTokens, stem } from './searchNormalize'

describe('normalisera', () => {
  it('trimmar, gör gemener och viker svenska diakriter', () => {
    expect(normalize('  Förlåtelse ')).toBe('forlatelse')
    expect(normalize('DÖDEN')).toBe('doden')
    expect(normalize('Ängslan')).toBe('angslan')
  })

  it('lämnar redan normaliserad text oförändrad', () => {
    expect(normalize('lugn')).toBe('lugn')
  })
})

describe('ordlista', () => {
  it('delar på skiljetecken och släpper tomma', () => {
    expect(wordList('Vad gör oron med dagen?')).toEqual(['vad', 'gor', 'oron', 'med', 'dagen'])
  })
})

describe('soktokens', () => {
  it('filtrerar bort stopord', () => {
    expect(searchTokens('Hur lever man med osäkerhet?')).toEqual(['lever', 'osakerhet'])
  })

  it('ger tom lista när frågan bara är stopord', () => {
    expect(searchTokens('vad är det som')).toEqual([])
  })
})

describe('stam', () => {
  it('förenar singular och plural', () => {
    expect(stem('frågor')).toBe(stem('fråga'))
    expect(stem('gåvor')).toBe(stem('gåva'))
  })

  it('rör inte korta ord', () => {
    expect(stem('ro')).toBe('ro')
    expect(stem('liv')).toBe('liv')
  })
})

describe('inomEttSkrivfel', () => {
  it('tolererar ett utskott', () => {
    expect(withinTypo('förlåtele', 'förlåtelse')).toBe(true)
    expect(withinTypo(normalize('förlåtele'), normalize('förlåtelse'))).toBe(true)
  })

  it('tolererar ett teckenbyte och en omkastning', () => {
    expect(withinTypo('stoicsm', 'stoicism')).toBe(true)
    expect(withinTypo('meninng', 'menning')).toBe(true)
    expect(withinTypo('samtla', 'samtal')).toBe(true)
  })

  it('avvisar korta ord där ett fel byter mening', () => {
    expect(withinTypo('lugn', 'lung')).toBe(false)
    expect(withinTypo('ro', 'ru')).toBe(false)
  })

  it('avvisar två eller fler fel', () => {
    expect(withinTypo('stoism', 'stoicism')).toBe(false)
    expect(withinTypo('förltse', 'förlåtelse')).toBe(false)
  })

  it('räknar inte lika ord som en felträff', () => {
    expect(withinTypo('förlåtelse', 'förlåtelse')).toBe(false)
  })
})
