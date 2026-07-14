// Bibliotekssökets sida (search.md): ett debouncat fält, URL-buret sökstate,
// grupperade ändliga resultat och en separat privat anteckningsgrupp. Söket bor
// i Biblioteket och tar aldrig plats i läsrummet. Ingen popularitetssignal.
import { useEffect, useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { sokAnteckningar } from '../../lib/sokanteckningar'
import { sokindexet, type Soktyp } from '../../lib/sokindex'
import { sokIBiblioteket, synligaTraffar, type Sokgrupp } from '../../lib/soklogik'
import { normalisera } from '../../lib/soknormalisering'
import { useAtlas } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { Filter, Resultatvy, type Sokläge } from './SokDelar'
import styles from './Sok.module.css'

// Vilka grupper som expanderats, ihågkommet per normaliserad fråga över
// navigation inom sessionen (search.md: sökstate får vara tillfälligt).
const expansionsminne = new Map<string, Set<Soktyp>>()
const hämtaExpansion = (nyckel: string): Set<Soktyp> => new Set(expansionsminne.get(nyckel))

// Den delbara sökparametern; tom fråga och intet filter utelämnas ur URL:en.
const sökObjekt = (term: string, typ: Soktyp | undefined): { q?: string; typ?: Soktyp } => ({
  ...(term ? { q: term } : {}),
  ...(typ ? { typ } : {}),
})

const sokResultat = (term: string): { grupper: Sokgrupp[]; fel: boolean } => {
  try {
    return { grupper: sokIBiblioteket(term, sokindexet), fel: false }
  } catch {
    return { grupper: [], fel: true }
  }
}

const beräknaLäge = (nyckel: string, fel: boolean): Sokläge =>
  nyckel.length < 2 ? 'tom' : fel ? 'fel' : 'klar'

type Props = {
  q: string
  typ: Soktyp | undefined
  onNavigera: (sök: { q?: string; typ?: Soktyp }) => void
}

export const SokBibliotekPage = ({ q, typ, onNavigera }: Props) => {
  const [query, setQuery] = useState(q)
  const [direkt, setDirekt] = useState<string | null>(null)
  const debounced = useDebounced(query.trim(), 250)
  const term = direkt ?? debounced
  const nyckel = normalisera(term)
  const [expanderade, setExpanderade] = useState<Set<Soktyp>>(() => hämtaExpansion(nyckel))
  const anteckningar = useAtlas().anteckningar

  // Skriv termen till URL:en (delbar, överlever refresh) bara när den skiljer
  // sig — alltid replace, så ingen historik- eller renderingsloop uppstår.
  useEffect(() => {
    if (term !== q) onNavigera(sökObjekt(term, typ))
  }, [term, q, typ, onNavigera])

  // Ny fråga ⇒ läs om vilka grupper som var expanderade för just den frågan.
  useEffect(() => {
    setExpanderade(hämtaExpansion(normalisera(term)))
  }, [term])

  const visaFler = (grupptyp: Soktyp): void => {
    setExpanderade((prev) => {
      const nästa = new Set(prev).add(grupptyp)
      expansionsminne.set(nyckel, nästa)
      return nästa
    })
  }

  const { grupper, fel } = sokResultat(term)
  const filtrerade = typ ? grupper.filter((grupp) => grupp.typ === typ) : grupper
  const synliga = synligaTraffar(filtrerade, expanderade)
  const noteringar = typ ? [] : sokAnteckningar(term, anteckningar)
  const antal =
    filtrerade.reduce((summa, grupp) => summa + grupp.traffar.length, 0) + noteringar.length

  return (
    <div className="screenSub">
      <TopBar />
      <form
        role="search"
        onSubmit={(händelse) => {
          händelse.preventDefault()
          setDirekt(query.trim())
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
          onChange={(händelse) => {
            setQuery(händelse.target.value)
            setDirekt(null)
          }}
          placeholder="Sök efter en fråga, tanke eller källa"
          autoFocus
        />
      </form>
      <Filter aktiv={typ} antal={antal} onVal={(nyTyp) => onNavigera(sökObjekt(term, nyTyp))} />
      <Resultatvy
        läge={beräknaLäge(nyckel, fel)}
        synliga={synliga}
        noteringar={noteringar}
        antal={antal}
        onVisaFler={visaFler}
      />
    </div>
  )
}
