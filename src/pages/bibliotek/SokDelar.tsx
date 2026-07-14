// Presentationsdelar för bibliotekssöket (search.md): grupperade resultat,
// ändliga med »Visa fler«, samt lugna tom-/no-results-/fellägen. Ingen del visar
// popularitet, förlopp eller orelaterade rekommendationer.
import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { ToLink } from '../../components/ToLink'
import { slugOfBook, type BookHit, type SearchHit } from '../../lib/api'
import type { Anteckning } from '../../lib/personligt'
import type { Soktyp } from '../../lib/sokindex'
import { MAX_SYNLIGA_PER_GRUPP, type Soktraff, type SynligGrupp } from '../../lib/soklogik'
import { AnteckningsKort, anteckningTillKort } from '../SparatDelar'
import styles from './Sok.module.css'

/** Verssökets svar från servern (verkläsarens FTS över källtexterna). */
export type Kalltextsvar = { books: BookHit[]; hits: SearchHit[] }

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

// Renderar FTS-snippeten med ⟦…⟧-markörer som markerade träfford (tillgänglig
// markup, inte enbart färg).
const Snippet = ({ text }: { text: string }) => (
  <span className={styles.snippet}>
    {text.split(/⟦|⟧/).map((del, i) =>
      i % 2 === 1 ? (
        <mark key={i} className={styles.mark}>
          {del}
        </mark>
      ) : (
        <span key={i}>{del}</span>
      ),
    )}
  </span>
)

const BokRad = ({ hit }: { hit: BookHit }) => (
  <Link
    to="/bibliotek/verk/$workId/$bookSlug"
    params={{ workId: hit.workId, bookSlug: slugOfBook(hit.workId, hit.bookId) }}
    className={styles.rad}
  >
    <span>
      <span className={styles.radTitel}>{hit.bookName}</span>
      <span className={styles.radSub}>{hit.workTitle}</span>
    </span>
    <span className={styles.chev}>›</span>
  </Link>
)

const VersRad = ({ hit }: { hit: SearchHit }) => (
  <Link
    to="/kapitel/$workId/$bookSlug/$chapter"
    params={{
      workId: hit.workId,
      bookSlug: slugOfBook(hit.workId, hit.bookId),
      chapter: String(hit.chapter),
    }}
    className={styles.kalltextHit}
  >
    <span className={styles.hitRef}>
      {hit.workTitle} · {hit.bookName} {hit.chapter}:{hit.verse}
    </span>
    <Snippet text={hit.snippet} />
  </Link>
)

/** Gruppen »Ur källtexterna«: verkläsarens FTS-verssök som en del av det samlade
 * söket (behåller /bibliotek-sok orörd). Tyst laddning — gruppen dyker upp när
 * data finns; vid fel en lugn rad, aldrig orelaterat innehåll. */
export const KalltextGrupp = ({
  svar,
  fel,
}: {
  svar: Kalltextsvar | null
  fel: string | null
}) => {
  const [visaAlla, setVisaAlla] = useState(false)
  if (fel !== null)
    return (
      <section className={styles.grupp}>
        <h2 className="kicker sectionKicker">Ur källtexterna</h2>
        <p className={styles.tomhint}>Sökningen i källtexterna kunde inte genomföras just nu.</p>
      </section>
    )
  if (svar === null || (svar.books.length === 0 && svar.hits.length === 0)) return null
  const verser = visaAlla ? svar.hits : svar.hits.slice(0, MAX_SYNLIGA_PER_GRUPP)
  const dolda = svar.hits.length - verser.length
  return (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Ur källtexterna</h2>
      {svar.books.map((hit) => (
        <BokRad key={hit.bookId} hit={hit} />
      ))}
      {verser.map((hit) => (
        <VersRad key={`${hit.bookId}-${hit.chapter}-${hit.verse}`} hit={hit} />
      ))}
      {dolda > 0 && (
        <button type="button" className={styles.visaFler} onClick={() => setVisaAlla(true)}>
          Visa fler ({dolda})
        </button>
      )}
    </section>
  )
}

/** Sökfältet: programmatiskt kopplad etikett, Enter söker direkt, Escape rensar
 * (type=search). Normal tab-ordning. */
export const Sokfalt = ({
  query,
  onChange,
  onSubmit,
}: {
  query: string
  onChange: (värde: string) => void
  onSubmit: () => void
}) => (
  <form
    role="search"
    onSubmit={(händelse) => {
      händelse.preventDefault()
      onSubmit()
    }}
  >
    <label htmlFor="bibliotekssok" className={styles.srOnly}>
      Sök i biblioteket
    </label>
    <input
      id="bibliotekssok"
      type="search"
      className={styles.falt}
      value={query}
      onChange={(händelse) => onChange(händelse.target.value)}
      placeholder="Sök efter en fråga, tanke eller källa"
      autoFocus
    />
  </form>
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
 * ändliga träffarna — redaktionella grupper, sedan »Ur källtexterna«, sist den
 * privata anteckningsgruppen. `ingaTraffar` avgörs av sidan (räknar även in
 * verssöket) så no-results aldrig visas medan källtextträffar är på väg. */
export const Resultatvy = ({
  läge,
  ingaTraffar,
  synliga,
  kalltext,
  noteringar,
  antal,
  onVisaFler,
}: {
  läge: Sokläge
  ingaTraffar: boolean
  synliga: SynligGrupp[]
  kalltext: ReactNode
  noteringar: Anteckning[]
  antal: number
  onVisaFler: (typ: Soktyp) => void
}) => {
  if (läge === 'tom') return <SokTomlage />
  if (läge === 'fel') return <Fellage />
  if (ingaTraffar) return <IngaTraffar />
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
      {kalltext}
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
