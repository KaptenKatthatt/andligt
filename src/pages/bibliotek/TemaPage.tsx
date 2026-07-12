import { useNavigate } from '@tanstack/react-router'
import { RumRad } from '../../components/RumRad'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { fragorForTema } from '../../lib/bibliotek'
import { allaFragor, allaRum, hittaTemaViaSlug, stycken } from '../../lib/innehall'
import { valbaraRum } from '../../lib/rumsval'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Rad, Sektion } from './Biblioteksdelar'

const Fragedel = ({ temaId }: { temaId: string }) => {
  const frågor = fragorForTema(temaId, allaFragor)
  if (frågor.length === 0) return null
  return (
    <Sektion rubrik="Frågor">
      {frågor.map((fråga) => (
        <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
          <Rad titel={fråga.text} />
        </ToLink>
      ))}
    </Sektion>
  )
}

/** Temasida (library.md, Themes): beskrivning och temats publicerade rum.
 * Utkast nås via direkt länk, märkta — samma granskningsvy som läsrummet. */
export const TemaPage = ({ slug }: { slug: string }) => {
  const tema = hittaTemaViaSlug(slug)
  const navigate = useNavigate()
  if (!tema) return <NotFoundNote subject="Temat" />
  const rum = valbaraRum(tema.id, allaRum)
  return (
    <div className="screenSub">
      <TopBar onBack={() => navigate({ to: '/bibliotek' })} />
      <header className={styles.huvud}>
        <div className="kicker">
          Tema
          {tema.status !== 'publicerad' && ' · Utkast'}
        </div>
        <h1 className={styles.huvudTitel}>{tema.etikett}</h1>
      </header>
      {tema.beskrivning &&
        stycken(tema.beskrivning).map((stycke, i) => (
          <p key={i} className={styles.beskrivning}>
            {stycke}
          </p>
        ))}
      <Fragedel temaId={tema.id} />
      <div className={styles.sektion}>
        <div className="kicker sectionKicker">Rum</div>
        {rum.length === 0 ? (
          <p className={styles.tomt}>Det finns inga färdiga rum här ännu.</p>
        ) : (
          rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
        )}
      </div>
    </div>
  )
}
