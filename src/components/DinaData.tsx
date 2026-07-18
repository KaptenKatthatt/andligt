import { useState } from 'react'
import { findTopic } from '../content/topics'
import { readImport, toExport, toMarkdown, type PersonalExport } from '../lib/dataTransfer'
import { findRoomById, findPathById } from '../lib/content'
import type { Origin } from '../lib/personal'
import { personalCollections, useAtlas } from '../lib/store'
import styles from './DinaData.module.css'

// Läsbara titlar för exportens anteckningar och sparade poster, per ursprung.
const titelFor = (type: Origin, id: string): string | undefined => {
  if (type === 'rum') return findRoomById(id)?.title
  if (type === 'vandring') return findPathById(id)?.title
  return findTopic(id)?.title
}

// Laddar ner en textfil via en objekt-URL och ett osynligt ankare.
const download = (innehåll: string, filnamn: string, mediatyp: string): void => {
  const blob = new Blob([innehåll], { type: mediatyp })
  const url = URL.createObjectURL(blob)
  const ankare = document.createElement('a')
  ankare.href = url
  ankare.download = filnamn
  ankare.click()
  // Skjut upp återkallandet: vissa webbläsare (Safari/mobil) avbryter
  // nedladdningen om objekt-URL:en återkallas synkront innan den lästs.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const readImportSafely = (text: string): PersonalExport | null => {
  try {
    return readImport(JSON.parse(text))
  } catch {
    return null
  }
}

/** Rensa lokal data: en enkel bekräftelse som räknar upp exakt vad som försvinner
 * och pekar på export först, så rensningen aldrig blir en överraskning. */
const Rensning = ({ onRensa }: { onRensa: () => void }) => {
  const [bekräftar, setBekräftar] = useState(false)
  if (!bekräftar)
    return (
      <button type="button" className={styles.knapp} onClick={() => setBekräftar(true)}>
        Rensa lokal data
      </button>
    )
  return (
    <div className={styles.rensning}>
      <p className={styles.rensText}>
        Detta tar bort alla anteckningar, sparade rum och vandringar, bokmärken och läshistorik
        från den här enheten. Utseendet behålls. Exportera först om du vill spara en kopia.
      </p>
      <div className={styles.rad}>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => {
            onRensa()
            setBekräftar(false)
          }}
        >
          Ta bort allt
        </button>
        <button type="button" className={styles.knapp} onClick={() => setBekräftar(false)}>
          Avbryt
        </button>
      </div>
    </div>
  )
}

/** Dina data (notes-and-saved.md, Export/Import): exportera personlig data i
 * öppna format, importera tillbaka och rensa lokalt — läsarens reflektioner ska
 * aldrig låsas in. Personlig data behandlas aldrig av AI och lämnar aldrig
 * enheten utom när läsaren själv exporterar den. */
export const DinaData = () => {
  const store = useAtlas()
  const [fel, setFel] = useState<string | undefined>(undefined)

  const bygg = (): PersonalExport =>
    toExport(personalCollections(store), titelFor, new Date().toISOString())
  const stamp = new Date().toISOString().slice(0, 10)

  const importera = async (fil: File): Promise<void> => {
    const data = readImportSafely(await fil.text())
    if (data === null) {
      setFel('Filen kunde inte läsas.')
      return
    }
    store.importeraPersonligt(data)
    setFel(undefined)
  }

  return (
    <div>
      <div className={styles.rad}>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => download(JSON.stringify(bygg(), null, 2), `visdomsatlasen-${stamp}.json`, 'application/json')}
        >
          Exportera
        </button>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => download(toMarkdown(bygg()), `visdomsatlasen-${stamp}.md`, 'text/markdown')}
        >
          Exportera som text
        </button>
        <label className={styles.knapp}>
          Importera
          <input
            type="file"
            accept="application/json,.json"
            className={styles.dold}
            onChange={(event) => {
              const fil = event.target.files?.[0]
              event.target.value = ''
              if (fil) void importera(fil)
            }}
          />
        </label>
      </div>
      {fel !== undefined && <p className={styles.fel}>{fel}</p>}
      <Rensning onRensa={store.rensaPersonligt} />
    </div>
  )
}
