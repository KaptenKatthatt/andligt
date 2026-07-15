import { useRef, type ReactNode } from 'react'
import { useDialogTangentbord } from '../lib/useDialogTangentbord'
import styles from './BottomSheet.module.css'

type Props = {
  label: string
  title?: string
  onClose: () => void
  children: ReactNode
}

/** Delat bottenark: scrim, uppglidande ram och rubrikrad med "Klar"-knapp. */
export const BottomSheet = ({ label, title, onClose, children }: Props) => {
  const arkRef = useRef<HTMLDivElement>(null)
  useDialogTangentbord(arkRef, onClose)
  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.scrim}
        onClick={onClose}
        aria-label={`Stäng ${label.toLowerCase()}`}
        tabIndex={-1}
      />
      <div className={styles.holder}>
        <div
          ref={arkRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
        >
          <div className={styles.head}>
            <div>
              <div className="kicker">{label}</div>
              {title && <div className={styles.title}>{title}</div>}
            </div>
            <button type="button" className={styles.done} onClick={onClose}>
              Klar
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
