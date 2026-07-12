import { useNavigate } from '@tanstack/react-router'
import { RumRad } from '../../components/RumRad'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Fraga, Tema } from '../../content/redaktion/schema'
import { kallorForFraga, rumForFraga } from '../../lib/bibliotek'
import {
  allaKallor,
  allaRum,
  hittaFraga,
  hittaFragaViaSlug,
  hittaTema,
  kallnamn,
  stycken,
} from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Rad, Sektion } from './Biblioteksdelar'

const Rumsdel = ({ fråga }: { fråga: Fraga }) => {
  const rum = rumForFraga(fråga.id, allaRum)
  return (
    <Sektion rubrik="Rum">
      {rum.length === 0 ? (
        <p className={styles.tomt}>Det finns inga färdiga rum kring frågan ännu.</p>
      ) : (
        rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
      )}
    </Sektion>
  )
}

const Temadel = ({ fråga }: { fråga: Fraga }) => {
  const teman = fråga.teman
    .map((id) => hittaTema(id))
    .filter((tema): tema is Tema => tema !== undefined && tema.status === 'publicerad')
  if (teman.length === 0) return null
  return (
    <Sektion rubrik="Teman">
      {teman.map((tema) => (
        <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
          <Rad titel={tema.etikett} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Kalldel = ({ fråga }: { fråga: Fraga }) => {
  const källor = kallorForFraga(fråga.id, allaRum, allaKallor)
  if (källor.length === 0) return null
  return (
    <Sektion rubrik="Källor">
      {källor.map((källa) => (
        <ToLink key={källa.id} to={{ kind: 'kallpost', slug: källa.slug }} className={styles.rad}>
          <Rad titel={källa.titel} sub={kallnamn(källa)} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Narliggande = ({ fråga }: { fråga: Fraga }) => {
  const frågor = (fråga.relateradeFrågor ?? [])
    .map((id) => hittaFraga(id))
    .filter(
      (relaterad): relaterad is Fraga =>
        relaterad !== undefined && relaterad.status === 'publicerad',
    )
  if (frågor.length === 0) return null
  return (
    <Sektion rubrik="Närliggande frågor">
      {frågor.map((relaterad) => (
        <ToLink
          key={relaterad.id}
          to={{ kind: 'fraga', slug: relaterad.slug }}
          className={styles.rad}
        >
          <Rad titel={relaterad.text} />
        </ToLink>
      ))}
    </Sektion>
  )
}

/** Frågesida (library.md, Questions): beskrivning, rum, teman och
 * källmaterial. En plats att välja från — aldrig en automatisk lässekvens. */
export const FragaPage = ({ slug }: { slug: string }) => {
  const fråga = hittaFragaViaSlug(slug)
  const navigate = useNavigate()
  if (!fråga) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar onBack={() => navigate({ to: '/bibliotek' })} />
      <header className={styles.huvud}>
        <div className="kicker">
          Fråga
          {fråga.status !== 'publicerad' && ' · Utkast'}
        </div>
        <h1 className={styles.huvudTitel}>{fråga.text}</h1>
      </header>
      {fråga.beskrivning &&
        stycken(fråga.beskrivning).map((stycke, i) => (
          <p key={i} className={styles.beskrivning}>
            {stycke}
          </p>
        ))}
      <Rumsdel fråga={fråga} />
      <Temadel fråga={fråga} />
      <Kalldel fråga={fråga} />
      <Narliggande fråga={fråga} />
    </div>
  )
}
