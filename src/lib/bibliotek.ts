// Bibliotekets urval (roadmap fas 6, library.md): i bibliotekets listor får
// bara publicerat innehåll synas — striktare än tröskelns temafilter
// (!== 'arkiverad'), som visar utkastteman i väntan på deras första rum.
// Rätta inte "åt andra hållet": utkast nås enbart via direkt länk och är
// redaktionens granskningsvy, aldrig en del av utforskningen.
import type { Kalla, Rum, Tema, Tradition } from '../content/redaktion/schema'

const publicerade = <T extends { status: Rum['status'] }>(poster: T[]): T[] =>
  poster.filter((post) => post.status === 'publicerad')

const SIST = Number.MAX_SAFE_INTEGER

/** Bibliotekets teman: publicerade, i samma redaktionella ordning som tröskeln. */
export const bibliotekTeman = (teman: Tema[]): Tema[] =>
  publicerade(teman).sort(
    (a, b) =>
      (a.ordning ?? SIST) - (b.ordning ?? SIST) || a.etikett.localeCompare(b.etikett, 'sv'),
  )

/** Den ändliga rumslistan: publicerade rum i svensk titelordning. */
export const bibliotekRum = (rum: Rum[]): Rum[] =>
  publicerade(rum).sort((a, b) => a.titel.localeCompare(b.titel, 'sv'))

/** Bibliotekets källposter: publicerade, i svensk titelordning. */
export const bibliotekKallor = (källor: Kalla[]): Kalla[] =>
  publicerade(källor).sort((a, b) => a.titel.localeCompare(b.titel, 'sv'))

/** Traditionerna: publicerade, i svensk namnordning. Sekundär ingång —
 * de hjälper till med sammanhang men äger inte frågorna (library.md). */
export const bibliotekTraditioner = (traditioner: Tradition[]): Tradition[] =>
  publicerade(traditioner).sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

/** Publicerade rum som använder källan — rum med primär relation först. */
export const rumForKalla = (kallaId: string, rum: Rum[]): Rum[] => {
  const primärvikt = (ettRum: Rum): number =>
    ettRum.källor.some((relation) => relation.källa === kallaId && relation.primär) ? 0 : 1
  return publicerade(rum)
    .filter((ettRum) => ettRum.källor.some((relation) => relation.källa === kallaId))
    .sort((a, b) => primärvikt(a) - primärvikt(b) || a.titel.localeCompare(b.titel, 'sv'))
}
