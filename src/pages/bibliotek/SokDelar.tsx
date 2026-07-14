// Presentationsdelar för bibliotekssöket (search.md): grupperade resultat,
// ändliga med »Visa fler«, samt lugna tom-/no-results-/fellägen. Ingen del visar
// popularitet, förlopp eller orelaterade rekommendationer.
import { useState } from 'react'
import { ToLink } from '../../components/ToLink'
import type { Anteckning } from '../../lib/personligt'
import type { Soktyp } from '../../lib/sokindex'
import type { Soktraff, SynligGrupp } from '../../lib/soklogik'
import { AnteckningsKort, anteckningTillKort } from '../SparatDelar'
import styles from './Sok.module.css'

const TraffRad = ({ traff }: { traff: Soktraff }) => {
  const { titel, underrad, meta, mal } = traff.dokument
  const innehåll = (
    <span>
      <span className={styles.radTitel}>{titel}</span>
      {underrad !== undefined && <span className={styles.radSub}>{underrad}</span>}
      {meta !== undefined && <span className={styles.radMeta}>{meta}</span>}
    </span>
  )
  if (mal === undefined) return <div className={styles.stillaRad}>{innehåll}</div>
  return (
    <ToLink to={mal} className={styles.rad}>
      {innehåll}
      <span className={styles.chev}>›</span>
    </ToLink>
  )
}

const SokGruppSektion = ({
  synlig,
  onVisaFler,
}: {
  synlig: SynligGrupp
  onVisaFler: () => void
}) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{synlig.grupp.rubrik}</h2>
    {synlig.synliga.map((traff) => (
      <TraffRad key={traff.dokument.id} traff={traff} />
    ))}
    {synlig.dolda > 0 && (
      <button type="button" className={styles.visaFler} onClick={onVisaFler}>
        Visa fler ({synlig.dolda})
      </button>
    )}
  </section>
)

// Privata anteckningsträffar — egen grupp sist, varje kort tydligt märkt privat.
const AnteckningsGruppSok = ({ anteckningar }: { anteckningar: Anteckning[] }) =>
  anteckningar.length === 0 ? null : (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Anteckningar</h2>
      {anteckningar.map((anteckning) => {
        const kort = anteckningTillKort(anteckning)
        return (
          <div key={kort.key} className={styles.privatKort}>
            <span className={styles.privatMarkor}>Privat anteckning</span>
            <AnteckningsKort titel={kort.titel} text={kort.text} datum={kort.datum} to={kort.to} />
          </div>
        )
      })}
    </section>
  )

const SokTomlage = () => (
  <p className={styles.tomtext}>Sök bland frågor, rum, källor och traditioner.</p>
)

const IngaTraffar = () => (
  <div className={styles.tillstand} role="status">
    <p className={styles.tomtext}>Vi hittade inget som stämde med din sökning.</p>
    <p className={styles.tomhint}>
      Prova ett bredare ord eller sök efter en fråga, ett tema eller en källa.
    </p>
  </div>
)

const Fellage = () => (
  <div className={styles.tillstand} role="status">
    <p className={styles.tomtext}>Sökningen kunde inte genomföras just nu.</p>
    <p className={styles.tomhint}>Försök igen eller gå tillbaka till Biblioteket.</p>
  </div>
)

export type Sokläge = 'tom' | 'fel' | 'klar'

const traffAntal = (antal: number): string => (antal === 1 ? '1 träff' : `${antal} träffar`)

/** Resultatvyn: tomläge före sökning, felläge, no-results eller de grupperade,
 * ändliga träffarna med den privata anteckningsgruppen sist. */
export const Resultatvy = ({
  läge,
  synliga,
  noteringar,
  antal,
  onVisaFler,
}: {
  läge: Sokläge
  synliga: SynligGrupp[]
  noteringar: Anteckning[]
  antal: number
  onVisaFler: (typ: Soktyp) => void
}) => {
  if (läge === 'tom') return <SokTomlage />
  if (läge === 'fel') return <Fellage />
  if (antal === 0) return <IngaTraffar />
  return (
    <>
      <p role="status" className={styles.status}>
        {traffAntal(antal)}
      </p>
      {synliga.map((synlig) =>
        synlig.synliga.length > 0 || synlig.dolda > 0 ? (
          <SokGruppSektion
            key={synlig.grupp.typ}
            synlig={synlig}
            onVisaFler={() => onVisaFler(synlig.grupp.typ)}
          />
        ) : null,
      )}
      <AnteckningsGruppSok anteckningar={noteringar} />
    </>
  )
}

const TYPVAL: Array<{ värde: Soktyp | 'alla'; etikett: string }> = [
  { värde: 'alla', etikett: 'Alla' },
  { värde: 'fraga', etikett: 'Frågor' },
  { värde: 'tema', etikett: 'Teman' },
  { värde: 'rum', etikett: 'Rum' },
  { värde: 'vandring', etikett: 'Vandringar' },
  { värde: 'kalla', etikett: 'Källor' },
  { värde: 'tradition', etikett: 'Traditioner' },
]

/** Valfria, hopfällda typfilter (search.md, Filters): aldrig krav före sökning,
 * aktivt filter tydligt och lätt att rensa. */
export const Filter = ({
  aktiv,
  antal,
  onVal,
}: {
  aktiv: Soktyp | undefined
  antal: number
  onVal: (typ: Soktyp | undefined) => void
}) => {
  const [öppen, setÖppen] = useState(false)
  return (
    <div className={styles.filter}>
      <button
        type="button"
        className={styles.filterknapp}
        aria-expanded={öppen}
        onClick={() => setÖppen((v) => !v)}
      >
        Filtrera
      </button>
      {öppen && (
        <div className={styles.filterrad}>
          {TYPVAL.map((val) => {
            const vald = val.värde === 'alla' ? aktiv === undefined : aktiv === val.värde
            return (
              <button
                key={val.värde}
                type="button"
                className={vald ? styles.chipVald : styles.chip}
                aria-pressed={vald}
                onClick={() => onVal(val.värde === 'alla' ? undefined : val.värde)}
              >
                {val.etikett}
              </button>
            )
          })}
        </div>
      )}
      {aktiv !== undefined && (
        <p className={styles.filterinfo}>
          {traffAntal(antal)} ·{' '}
          <button type="button" className={styles.rensa} onClick={() => onVal(undefined)}>
            Rensa filter
          </button>
        </p>
      )}
    </div>
  )
}
