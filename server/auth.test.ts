import { describe, expect, it } from 'vitest'
import { accessCookieValue, verifyAccessCode, verifyAccessCookie } from './auth'

const CODE = 'hemlig-testarkod-1234567890'

describe('verifyAccessCode', () => {
  it('accepterar rätt kod', () => {
    expect(verifyAccessCode(CODE, CODE)).toBe(true)
  })

  it('avvisar fel kod', () => {
    expect(verifyAccessCode('fel', CODE)).toBe(false)
  })

  it('avvisar tom inskickad kod', () => {
    expect(verifyAccessCode('', CODE)).toBe(false)
  })

  it('avvisar när ingen kod är konfigurerad', () => {
    expect(verifyAccessCode(CODE, '')).toBe(false)
  })
})

describe('accessCookieValue / verifyAccessCookie', () => {
  it('cookien lagrar aldrig plaintext-koden', () => {
    const value = accessCookieValue(CODE)
    expect(value).not.toContain(CODE)
    expect(value).toMatch(/^[0-9a-f]{64}$/)
  })

  it('verifierar cookien mot den härledda token', () => {
    expect(verifyAccessCookie(accessCookieValue(CODE), CODE)).toBe(true)
  })

  it('avvisar en cookie som inte matchar koden', () => {
    expect(verifyAccessCookie(accessCookieValue('annan'), CODE)).toBe(false)
  })

  it('avvisar tom cookie och osatt kod', () => {
    expect(verifyAccessCookie(null, CODE)).toBe(false)
    expect(verifyAccessCookie(accessCookieValue(CODE), '')).toBe(false)
  })
})
