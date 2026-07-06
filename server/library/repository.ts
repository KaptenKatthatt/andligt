import { and, asc, eq, gt, lt, desc } from 'drizzle-orm'
import { db } from '../db'
import { books, verses, works } from '../db/schema'
import type { Book, Verse, Work } from '../db/schema'

export type WorkSummary = Work & { bookCount: number }

export const listWorks = (): WorkSummary[] => {
  const rows = db.select().from(works).orderBy(asc(works.position), asc(works.title)).all()
  return rows.map((w) => {
    const bookCount = db.select().from(books).where(eq(books.workId, w.id)).all().length
    return { ...w, bookCount }
  })
}

export const getWork = (id: string): { work: Work; books: Book[] } | null => {
  const work = db.select().from(works).where(eq(works.id, id)).get()
  if (!work) return null
  const list = db.select().from(books).where(eq(books.workId, id)).orderBy(asc(books.position)).all()
  return { work, books: list }
}

const neighbourChapter = (bookId: string, chapter: number, dir: 'prev' | 'next'): number | null => {
  const cond = dir === 'next' ? gt(verses.chapter, chapter) : lt(verses.chapter, chapter)
  const order = dir === 'next' ? asc(verses.chapter) : desc(verses.chapter)
  const row = db
    .select({ chapter: verses.chapter })
    .from(verses)
    .where(and(eq(verses.bookId, bookId), cond))
    .orderBy(order)
    .get()
  return row?.chapter ?? null
}

export type ChapterView = {
  book: Book
  chapter: number
  verses: Verse[]
  prev: number | null
  next: number | null
}

export const getChapter = (bookId: string, chapter: number): ChapterView | null => {
  const book = db.select().from(books).where(eq(books.id, bookId)).get()
  if (!book) return null
  const rows = db
    .select()
    .from(verses)
    .where(and(eq(verses.bookId, bookId), eq(verses.chapter, chapter)))
    .orderBy(asc(verses.verse))
    .all()
  if (rows.length === 0) return null
  return {
    book,
    chapter,
    verses: rows,
    prev: neighbourChapter(bookId, chapter, 'prev'),
    next: neighbourChapter(bookId, chapter, 'next'),
  }
}
