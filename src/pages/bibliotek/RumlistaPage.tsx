import { TopBar } from '../../components/TopBar'
import { libraryRoom } from '../../lib/library'
import { allaRum } from '../../lib/content'
import styles from './Bibliotek.module.css'
import { Rumslista, roomCount, Sidhuvud } from './Biblioteksdelar'

/** Alla publicerade rum — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const RumlistaPage = () => {
  const rum = libraryRoom(allaRum)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Rum" title="Alla rum">
        <p className={styles.antal}>{roomCount(rum.length)}</p>
      </Sidhuvud>
      <div className={styles.sektion}>
        <Rumslista rum={rum} tomtBesked="Det finns inga färdiga rum ännu." />
      </div>
    </div>
  )
}
