import { describe, expect, it } from 'vitest'
import { inomSkrivfel, normalisera, ordlista, soktokens, stam } from './searchNormalize'

describe('normalisera', () => {
  it('trimmar, gör gemener och viker svenska diakriter', () => {
    expect(normalisera('  Förlåtelse ')).toBe('forlatelse')
    expect(normalisera('DÖDEN')).toBe('doden')
    expect(normalisera('Ängslan')).toBe('angslan')
  })

  it('lämnar redan normaliserad text oförändrad', () => {
    expect(normalisera('lugn')).toBe('lugn')
  })
})

describe('ordlista', () => {
  it('delar på skiljetecken och släpper tomma', () => {
    expect(ordlista('Vad gör oron med dagen?')).toEqual(['vad', 'gor', 'oron', 'med', 'dagen'])
  })
})

describe('soktokens', () => {
  it('filtrerar bort stopord', () => {
    expect(soktokens('Hur lever man med osäkerhet?')).toEqual(['lever', 'osakerhet'])
  })

  it('ger tom lista när frågan bara är stopord', () => {
    expect(soktokens('vad är det som')).toEqual([])
  })
})

describe('stam', () => {
  it('förenar singular och plural', () => {
    expect(stam('frågor')).toBe(stam('fråga'))
    expect(stam('gåvor')).toBe(stam('gåva'))
  })

  it('rör inte korta ord', () => {
    expect(stam('ro')).toBe('ro')
    expect(stam('liv')).toBe('liv')
  })
})

describe('inomEttSkrivfel', () => {
  it('tolererar ett utskott', () => {
    expect(inomSkrivfel('förlåtele', 'förlåtelse')).toBe(true)
    expect(inomSkrivfel(normalisera('förlåtele'), normalisera('förlåtelse'))).toBe(true)
  })

  it('tolererar ett teckenbyte och en omkastning', () => {
    expect(inomSkrivfel('stoicsm', 'stoicism')).toBe(true)
    expect(inomSkrivfel('meninng', 'menning')).toBe(true)
    expect(inomSkrivfel('samtla', 'samtal')).toBe(true)
  })

  it('avvisar korta ord där ett fel byter mening', () => {
    expect(inomSkrivfel('lugn', 'lung')).toBe(false)
    expect(inomSkrivfel('ro', 'ru')).toBe(false)
  })

  it('avvisar två eller fler fel', () => {
    expect(inomSkrivfel('stoism', 'stoicism')).toBe(false)
    expect(inomSkrivfel('förltse', 'förlåtelse')).toBe(false)
  })

  it('räknar inte lika ord som en felträff', () => {
    expect(inomSkrivfel('förlåtelse', 'förlåtelse')).toBe(false)
  })
})
