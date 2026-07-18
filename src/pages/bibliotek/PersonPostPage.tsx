import { TopBar } from '../../components/TopBar'
import { hittaPersonViaSlug } from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Sidhuvud } from './Biblioteksdelar'

/** Personsida i biblioteket (library.md, People and Authors): en referenspunkt,
 * inte en ingång — porträtt i lugn prosa, utan auktoritetsanspråk. Skild från
 * legacy-personsidorna under /person (gamla appens people.ts).
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const PersonPostPage = ({ slug }: { slug: string }) => {
  const person = hittaPersonViaSlug(slug)
  if (!person) return <NotFoundNote subject="Personen" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Person" titel={person.namn} status={person.status}>
        {person.årtal !== undefined && <p className={styles.artal}>{person.årtal}</p>}
      </Sidhuvud>
      <Beskrivning text={person.beskrivning} />
    </div>
  )
}
