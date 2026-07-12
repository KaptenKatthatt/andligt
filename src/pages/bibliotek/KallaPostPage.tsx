import { Link, useNavigate } from '@tanstack/react-router'
import { RumRad } from '../../components/RumRad'
import { TopBar } from '../../components/TopBar'
import type { Kalla, Tradition } from '../../content/redaktion/schema'
import { rumForKalla } from '../../lib/bibliotek'
import { allaRum, hittaKallaViaSlug, hittaTradition, stycken } from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'

const TYPETIKETT: Record<Kalla['typ'], string> = {
  'bok': 'Bok',
  'skrift': 'Skrift',
  'brev': 'Brev',
  'tal': 'Tal',
  'dikt': 'Dikt',
  'inskrift': 'Inskrift',
  'muntlig-tradition': 'Muntlig tradition',
  'historiskt-dokument': 'Historiskt dokument',
  'fragment': 'Fragment',
  'annat': 'Källa',
}

const RATTIGHETSETIKETT: Record<Kalla['rättigheter'], string> = {
  'public-domain': 'Fri att återge (public domain)',
  'licensierad': 'Licensierad',
  'skyddad': 'Upphovsrättsskyddad',
  'okänd': 'Oklar rättighetsstatus',
}

// Ärlig osäkerhet i klartext (source-and-context.md, Uncertainty): en
// tillskriven röst presenteras som tillskriven, aldrig som säkert upphov.
const upphovsrad = (källa: Kalla): string | undefined => {
  if (källa.tillskrivenFörfattare === undefined) return källa.författare
  const nedtecknare = källa.författare ? `, nedtecknad av ${källa.författare}` : ''
  const namn = `${källa.tillskrivenFörfattare}${nedtecknare}`
  return källa.upphov === 'tillskrivet' ? `Tillskrivs ${namn}` : namn
}

const Metarad = ({ etikett, värde }: { etikett: string; värde?: string }) =>
  värde === undefined || värde === '' ? null : (
    <p className={styles.metarad}>
      <span className={styles.metaetikett}>{etikett}</span>
      {värde}
    </p>
  )

const Kallmeta = ({ källa }: { källa: Kalla }) => {
  const traditionsnamn = (källa.traditioner ?? [])
    .map((id) => hittaTradition(id))
    .filter((t): t is Tradition => t !== undefined && t.status === 'publicerad')
    .map((t) => t.namn)
  return (
    <div className={styles.metablock}>
      <Metarad etikett="Upphov" värde={upphovsrad(källa)} />
      <Metarad etikett="Tradition" värde={traditionsnamn.join(', ')} />
      <Metarad
        etikett="Tillkomst"
        värde={[källa.ungefärligDatering, källa.plats].filter(Boolean).join(' · ')}
      />
      <Metarad etikett="Originalspråk" värde={källa.originalspråk} />
      <Metarad etikett="Rättigheter" värde={RATTIGHETSETIKETT[källa.rättigheter]} />
    </div>
  )
}

/** Källpost (library.md, Sources): saklig metadata, kopplade rum och vägen
 * in i biblioteksläsaren när hela texten finns där. Ingen auktoritetsprosa. */
export const KallaPostPage = ({ slug }: { slug: string }) => {
  const källa = hittaKallaViaSlug(slug)
  const navigate = useNavigate()
  if (!källa) return <NotFoundNote subject="Källan" />
  const rum = rumForKalla(källa.id, allaRum)
  return (
    <div className="screenSub">
      <TopBar onBack={() => navigate({ to: '/bibliotek' })} />
      <header className={styles.huvud}>
        <div className="kicker">
          {TYPETIKETT[källa.typ]}
          {källa.status !== 'publicerad' && ' · Utkast'}
        </div>
        <h1 className={styles.huvudTitel}>{källa.titel}</h1>
        {källa.originaltitel && <p className={styles.originaltitel}>{källa.originaltitel}</p>}
      </header>
      <Kallmeta källa={källa} />
      {källa.beskrivning &&
        stycken(källa.beskrivning).map((stycke, i) => (
          <p key={i} className={styles.beskrivning}>
            {stycke}
          </p>
        ))}
      {källa.biblioteksverk !== undefined && (
        <div className={styles.sektion}>
          <div className="kicker sectionKicker">Hela texten</div>
          <Link
            to="/bibliotek/verk/$workId"
            params={{ workId: källa.biblioteksverk }}
            className={styles.rad}
          >
            <span className={styles.radTitel}>Läs hela texten</span>
            <span className={styles.chev}>›</span>
          </Link>
        </div>
      )}
      <div className={styles.sektion}>
        <div className="kicker sectionKicker">Rum ur denna källa</div>
        {rum.length === 0 ? (
          <p className={styles.tomt}>Det finns inga färdiga rum ur källan ännu.</p>
        ) : (
          rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
        )}
      </div>
    </div>
  )
}
