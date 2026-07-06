import path from 'node:path'

const cwd = process.cwd()

/** Central runtime configuration, read once from the environment. */
export const config = {
  port: Number(process.env['PORT'] ?? 8080),
  // SQLite-filen. Monteras som volym på VPS:en (som newsAgg), aldrig i git.
  dbPath: process.env['DATABASE_URL'] ?? path.resolve(cwd, 'data', 'visdomsatlasen.db'),
  // Byggda SPA-filerna som servern levererar tillsammans med API:t.
  staticDir: process.env['STATIC_DIR'] ?? path.resolve(cwd, 'dist'),
  auth: {
    user: process.env['ATLAS_USER'],
    pass: process.env['ATLAS_PASS'],
  },
  // Bearer-token som låter cron/ingest-skript nå /api/ingest utan basic auth.
  ingestToken: process.env['INGEST_TOKEN'],
} as const
