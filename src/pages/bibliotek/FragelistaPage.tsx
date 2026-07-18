import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { libraryQuestions } from '../../lib/library'
import { allQuestions } from '../../lib/content'
import styles from './Bibliotek.module.css'
import { questionCount, Row, Sidhuvud } from './Biblioteksdelar'

/** Alla publicerade frågor — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const FragelistaPage = () => {
  const frågor = libraryQuestions(allQuestions)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Frågor" title="Alla frågor">
        <p className={styles.antal}>{questionCount(frågor.length)}</p>
      </Sidhuvud>
      <div className={styles.sektion}>
        {frågor.length === 0 ? (
          <p className={styles.tomt}>Inga frågor ännu.</p>
        ) : (
          frågor.map((fråga) => (
            <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
              <Row title={fråga.text} />
            </ToLink>
          ))
        )}
      </div>
    </div>
  )
}
