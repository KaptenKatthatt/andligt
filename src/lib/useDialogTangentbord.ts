import { useEffect, useRef, type RefObject } from 'react'

const FOKUSERBAR_VALJARE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/** Tangentbordsfokuserbara element inom roten, i dokumentordning. */
const fokuserbaraI = (rot: HTMLElement): HTMLElement[] =>
  Array.from(rot.querySelectorAll<HTMLElement>(FOKUSERBAR_VALJARE))

/** Håller Tab/Skift+Tab cyklande inom arket. */
const fångaTab = (ark: HTMLElement, händelse: KeyboardEvent) => {
  const fokuserbara = fokuserbaraI(ark)
  const första = fokuserbara.at(0)
  const sista = fokuserbara.at(-1)
  if (!första || !sista) {
    händelse.preventDefault()
    ark.focus()
    return
  }
  const aktivt = document.activeElement
  if (händelse.shiftKey && (aktivt === första || aktivt === ark)) {
    händelse.preventDefault()
    sista.focus()
  } else if (!händelse.shiftKey && aktivt === sista) {
    händelse.preventDefault()
    första.focus()
  }
}

/**
 * Modal tangentbordshantering för ett ark/dialog: flyttar fokus in i arket
 * vid öppning, stänger på Escape, håller Tab-fokus fångat inom arket och
 * återlämnar fokus till det tidigare fokuserade elementet vid stängning.
 * Arket behöver tabIndex={-1} för att kunna ta emot initialfokus.
 */
export const useDialogTangentbord = (
  arkRef: RefObject<HTMLElement | null>,
  onStäng: () => void,
): void => {
  const stängRef = useRef(onStäng)
  useEffect(() => {
    stängRef.current = onStäng
  })

  useEffect(() => {
    const ark = arkRef.current
    if (!ark) return
    const tidigare = document.activeElement
    ark.focus()
    const vidTangent = (händelse: KeyboardEvent) => {
      if (händelse.key === 'Escape') {
        stängRef.current()
      } else if (händelse.key === 'Tab') {
        fångaTab(ark, händelse)
      }
    }
    document.addEventListener('keydown', vidTangent)
    return () => {
      document.removeEventListener('keydown', vidTangent)
      if (tidigare instanceof HTMLElement) tidigare.focus()
    }
  }, [arkRef])
}
