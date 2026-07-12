import { Link } from '@tanstack/react-router'
import styles from './Bibliotek.module.css'

// Radens innehåll — själva länken varierar (statisk route eller ToLink).
const Rad = ({ titel, sub }: { titel: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.radTitel}>{titel}</span>
      {sub !== undefined && <span className={styles.radSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

/**
 * Bibliotekets landningssida (library.md) — den medvetna ingången till
 * utforskning. Sekundär till läsrummet; lugn, ändlig, utan engagemangsmått.
 */
export const BibliotekHemPage = () => (
  <div className="screenTab">
    <div className="kicker">Visdomsatlasen</div>
    <h1 className={styles.titel}>Biblioteket</h1>
    <p className={styles.lede}>
      För den som vill leta vidare på egen hand — bland frågor, teman, rum och källor.
    </p>
    <div className={styles.sektion}>
      <div className="kicker sectionKicker">Källor</div>
      <Link to="/bibliotek/verk" className={styles.rad}>
        <Rad titel="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
      </Link>
    </div>
    <div className={styles.sektion}>
      <div className="kicker sectionKicker">Sparat</div>
      <Link to="/samling" className={styles.rad}>
        <Rad titel="Sparat" sub="Det du sparat och antecknat" />
      </Link>
    </div>
  </div>
)
