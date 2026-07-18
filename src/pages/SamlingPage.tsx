import { RowLink } from '../components/RowLink'
import { RoomRow } from '../components/RumRad'
import type { Room, Path } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { findRoomById, findPathById } from '../lib/content'
import {
  chapterKey,
  sortedNotes,
  savedIdsByTime,
  type ChapterBookmark,
  type SavedItem,
} from '../lib/personal'
import { useAtlas } from '../lib/store'
import { useSidtitel } from '../lib/useSidtitel'
import styles from './SamlingPage.module.css'
import {
  NoteCard,
  noteToCard,
  Group,
  EmptyState,
  PathCard,
  type Kort,
} from './SparatDelar'

type SparadVandring = { vandring: Path; senastRum: string | undefined }

const RoomGroup = ({ rum }: { rum: Room[] }) =>
  rum.length === 0 ? null : (
    <Group rubrik="Rum">
      {rum.map((ettRum) => (
        <RoomRow key={ettRum.id} rum={ettRum} />
      ))}
    </Group>
  )

const PathGroup = ({ vandringar }: { vandringar: SparadVandring[] }) =>
  vandringar.length === 0 ? null : (
    <Group rubrik="Vandringar">
      {vandringar.map(({ vandring, senastRum }) => (
        <PathCard key={vandring.id} vandring={vandring} senastRum={senastRum} />
      ))}
    </Group>
  )

const BookmarkGroup = ({ topics }: { topics: { id: string; title: string; tradition: string; min: number }[] }) =>
  topics.length === 0 ? null : (
    <Group rubrik="Bokmärken">
      {topics.map((topic) => (
        <RowLink
          key={topic.id}
          to={{ kind: 'topic', id: topic.id }}
          title={topic.title}
          sub={`${topic.tradition} · ${topic.min} min`}
          chevron
          size="md"
        />
      ))}
    </Group>
  )

const SourcesGroup = ({ kapitel }: { kapitel: ChapterBookmark[] }) =>
  kapitel.length === 0 ? null : (
    <Group rubrik="Källor">
      {kapitel.map((b) => (
        <RowLink
          key={chapterKey(b.workId, b.bookSlug, b.chapter)}
          to={{ kind: 'kapitel', workId: b.workId, bookSlug: b.bookSlug, chapter: b.chapter }}
          title={b.bookName}
          sub={`Kapitel ${b.chapter}`}
          chevron
          size="md"
        />
      ))}
    </Group>
  )

const NoteGroup = ({ kort }: { kort: Kort[] }) =>
  kort.length === 0 ? null : (
    <Group rubrik="Anteckningar">
      {kort.map((k) => (
        <NoteCard key={k.key} title={k.title} text={k.text} datum={k.datum} to={k.to} />
      ))}
    </Group>
  )

/** Senast besökt (spec Recently Opened Items): bara orientering, aldrig en
 * krävande kö. Skild från Sparat och rensbar av läsaren. Ingen »Fortsätt
 * läsa«-formulering. */
const RecentlyVisitedGroup = ({ rum, onRensa }: { rum: Room[]; onRensa: () => void }) =>
  rum.length === 0 ? null : (
    <section className={styles.senast}>
      <div className={styles.senastHuvud}>
        <h2 className="kicker sectionKicker">Senast besökt</h2>
        <button type="button" className={styles.rensa} onClick={onRensa}>
          Rensa
        </button>
      </div>
      {rum.map((ettRum) => (
        <RowLink
          key={ettRum.id}
          to={{ kind: 'rum', slug: ettRum.slug }}
          title={ettRum.title}
          sub={ettRum.summary}
          size="md"
        />
      ))}
    </section>
  )

const savedPathsList = (
  sparadeVandringar: Record<string, SavedItem>,
  vandringsplatser: Record<string, string>,
): SparadVandring[] =>
  savedIdsByTime(sparadeVandringar)
    .map((id) => findPathById(id))
    .filter((vandring): vandring is Path => vandring !== undefined)
    .map((vandring) => ({
      vandring,
      senastRum: findRoomById(vandringsplatser[vandring.id] ?? '')?.title,
    }))

/** Sparat (notes-and-saved.md): en stilla place för det läsaren valt att bevara,
 * grupperat och lätt att överblicka — aldrig ett innehållsflöde, aldrig ett mått
 * på framsteg. Bara grupper med innehåll visas; är inget sparat möter ett lugnt
 * tomläge. Senast besökt ligger separat sist, för orientering. */
export const SamlingPage = () => {
  useSidtitel('Sparat')
  const store = useAtlas()
  const rum = savedIdsByTime(store.savedRooms)
    .map((id) => findRoomById(id))
    .filter((ettRum): ettRum is Room => ettRum !== undefined)
  const vandringar = savedPathsList(store.savedPaths, store.pathPositions)
  const topics = Object.keys(store.bookmarks)
    .filter((id) => store.bookmarks[id])
    .map(findTopic)
    .filter((topic) => topic !== undefined)
  const kapitel = Object.values(store.chapterBookmarks).sort((a, b) => b.savedAt - a.savedAt)
  const kort = sortedNotes(store.notes).map(noteToCard)
  const recent = store.recentRooms
    .map((id) => findRoomById(id))
    .filter((ettRum): ettRum is Room => ettRum !== undefined)

  const ingetSparat =
    rum.length === 0 &&
    vandringar.length === 0 &&
    topics.length === 0 &&
    kapitel.length === 0 &&
    kort.length === 0

  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Sparat</h1>
      <p className={styles.lede}>Det du sparat och tänkt.</p>
      {ingetSparat ? (
        <EmptyState />
      ) : (
        <>
          <RoomGroup rum={rum} />
          <PathGroup vandringar={vandringar} />
          <BookmarkGroup topics={topics} />
          <SourcesGroup kapitel={kapitel} />
          <NoteGroup kort={kort} />
        </>
      )}
      <RecentlyVisitedGroup rum={recent} onRensa={store.rensaSenastBesokt} />
    </div>
  )
}
