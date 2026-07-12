// Små byggstenar som bibliotekets sidor delar: sektionsrubriken och
// radinnehållet. Länken runt en rad varierar (statisk route eller ToLink).
import type { ReactNode } from 'react'
import styles from './Bibliotek.module.css'

export const Rad = ({ titel, sub }: { titel: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.radTitel}>{titel}</span>
      {sub !== undefined && <span className={styles.radSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

export const Sektion = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <div className={styles.sektion}>
    <div className="kicker sectionKicker">{rubrik}</div>
    {children}
  </div>
)
