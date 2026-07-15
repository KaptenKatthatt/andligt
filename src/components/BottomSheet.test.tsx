// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { BottomSheet } from './BottomSheet'

afterEach(cleanup)

describe('BottomSheet', () => {
  it('renderar en dialog med etikett, rubrik och innehåll', () => {
    render(
      <BottomSheet label="Anteckning" title="Om rummet" onClose={() => {}}>
        <p>Innehållet i arket</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Anteckning' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Om rummet')).toBeInTheDocument()
    expect(screen.getByText('Innehållet i arket')).toBeInTheDocument()
  })

  it('är modal och tar emot initialfokus', () => {
    render(
      <BottomSheet label="Anteckning" onClose={() => {}}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Anteckning' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.activeElement).toBe(dialog)
  })

  it('stänger på Escape', async () => {
    const användare = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await användare.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('anropar onClose via Klar-knappen och scrimmen', async () => {
    const användare = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await användare.click(screen.getByRole('button', { name: 'Klar' }))
    await användare.click(screen.getByRole('button', { name: 'Stäng anteckning' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
