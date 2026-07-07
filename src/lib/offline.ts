import { fetchWork, fetchWorks } from './api'

export type OfflineProgress = { done: number; total: number }

// Namnet på service-workerns runtime-cache (se runtimeCaching i vite.config.ts).
const CACHE_NAME = 'library-api'

/**
 * Räknar hur många kapitel som redan ligger i offline-cachen. Läser det faktiska
 * innehållet i CacheStorage, så statusen speglar verkligheten och överlever omladdning.
 * Returnerar 0 om Cache-API:t saknas eller cachen inte finns.
 */
export const countOfflineChapters = async (): Promise<number> => {
  try {
    if (!('caches' in globalThis)) return 0
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    return keys.filter((request) => request.url.includes('/chapters/')).length
  } catch {
    return 0
  }
}

/** Raderar hela offline-nedladdningen genom att ta bort runtime-cachen. */
export const deleteOfflineDownload = async (): Promise<void> => {
  try {
    if (!('caches' in globalThis)) return
    const names = await caches.keys()
    await Promise.all(
      names.filter((name) => name.includes(CACHE_NAME)).map((name) => caches.delete(name)),
    )
  } catch {
    // Sväljs: går inget att radera fungerar appen ändå.
  }
}

// Samla alla kapitel-URL:er (verk → böcker → kapitel) via metadatan.
const collectChapterUrls = async (): Promise<string[]> => {
  const { works } = await fetchWorks()
  const urls: string[] = []
  for (const work of works) {
    const { books } = await fetchWork(work.id)
    for (const book of books) {
      const id = encodeURIComponent(book.id)
      for (const n of book.chapters) {
        urls.push(`/api/library/books/${id}/chapters/${n}`)
      }
    }
  }
  return urls
}

/**
 * Hämtar hem alla kapitel så service-workerns runtime-cache fylls och texterna
 * går att läsa offline. Anropas medan enheten är ansluten (via Tailscale).
 */
export const downloadForOffline = async (
  onProgress: (progress: OfflineProgress) => void,
): Promise<void> => {
  const urls = await collectChapterUrls()
  let done = 0
  onProgress({ done, total: urls.length })
  for (const url of urls) {
    try {
      await fetch(url, { headers: { Accept: 'application/json' } })
    } catch {
      // Ett misslyckat kapitel hoppas över; resten cachas ändå.
    }
    done += 1
    onProgress({ done, total: urls.length })
  }
}
