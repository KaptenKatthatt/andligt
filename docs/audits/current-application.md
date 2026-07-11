# Granskning av den befintliga applikationen

Fas 0 i implementationsfärdplanen (`docs/specs/implementation-roadmap.md`).

Syftet är att kartlägga vad i dagens kodbas som kan behållas, anpassas, ersättas eller tas bort
innan den nya produktupplevelsen (reflektionsrum, teman, mänskliga frågor) byggs.

Granskningen gjordes 2026-07-11 mot commit `a67f8d6`.

Klassificering:

- **keep** – behålls som den är
- **adapt** – behålls men ändras för att passa den nya riktningen
- **replace** – ersätts av något nytt
- **remove** – tas bort
- **investigate** – kräver ett redaktionellt eller arkitektoniskt beslut innan klassificering

---

# Sammanfattning

Dagens app är två produkter i en:

1. **Atlasen** – sex handskrivna essäer med personer, tidslinje, konceptkarta och citat,
   som typade TypeScript-moduler i `src/content/`.
2. **Biblioteket** – hela källtexter (tolv verk) i SQLite bakom ett Hono-API,
   med FTS5-sök, offline-nedladdning och en fungerande läsare.

Den nya visionen behåller båda idéerna men byter kärna: **läsrummet** (ett rum, en fråga,
en tanke) blir centrum, och biblioteket blir den medvetna utforskningen.

Huvudslutsatsen:

> **Den tekniska grunden och biblioteket kan behållas nästan rakt av.
> Atlasens innehållsmodell och hela navigations-/hemupplevelsen behöver ersättas.**

Det som ska ersättas är förhållandevis tunt (en innehållsmodell utan frågor/teman/status,
en femfliksnavigering, en dashboard-artad hemskärm). Det som kan behållas är det som var
dyrast att bygga (backend, ingest, läsartypografi, designtokens, offline, deploy).

---

# 1. Projektstruktur och ramverk

| Del | Nuläge | Klassificering |
| --- | --- | --- |
| React 19 + Vite 7 + TypeScript strict | `tsconfig.app.json` m.fl., strict + `noUncheckedIndexedAccess` | **keep** |
| TanStack Router, kodbaserade rutter | `src/app/router.tsx`, platt rutträd | **keep** (rutterna byts, verktyget behålls) |
| CSS Modules + global tokenfil | `src/styles/global.css` + `*.module.css` | **keep** |
| Katalogstruktur `pages/` + `components/` + `content/` + `lib/` | platt, en komponent per skärm | **adapt** – färdplanen föreslår `features/` och `content/rooms/`; dagens struktur räcker tills rummen finns, men rumsinnehållet bör få en egen katalog från start |
| Kvalitetssvit: `tsc -b`, type-coverage 100 %, fallow (komplexitet + död kod) | `npm run check`, `.fallowrc.json` | **keep** |
| Testrunner | **saknas helt** – inga testfiler, ingen vitest/jest | **investigate → åtgärdas i Fas 1** (roadmapen kräver "working test command"; rumsvalslogiken i Fas 5 kräver deterministiska enhetstester) |
| Lint/format (ESLint/Prettier) | saknas; kvalitetsgrindarna är tsc + type-coverage + fallow | **investigate → Fas 1** – antingen läggs ESLint till, eller så dokumenteras medvetet att fallow+tsc är lintnivån |

Verifierat nuläge (2026-07-11): `npm run check` är grönt.
Typkontroll ok, type-coverage 100 % (5191/5191 app, 3505/3505 server),
416 funktioner inom komplexitetsgränserna, noll döda exporter.

---

# 2. Rutter och navigation

Dagens rutter (`src/app/router.tsx`) mot den nya navigationsmodellen
(`docs/specs/navigation.md`, `home-and-entry.md`):

| Rutt | Nuläge | Klassificering |
| --- | --- | --- |
| `/` HemPage | datum, "fortsätt där du var", ämneslista, dagens citat | **replace** – ny tröskel: "Vad vill du bära med dig idag?" + 4–8 teman. Specen förbjuder uttryckligen "fortsätt där du slutade", dagligt innehåll och dashboard-element på tröskeln |
| `/las/$id/$mode` LasPage | läsvy för essä/kontext, anteckningsark, läsinställningar | **adapt** – blir grunden för läsrummet; struktur enligt `reading-room.md` (öppning, kärntext, paus, tanke att bära, frågor, synlig källa) tillkommer |
| `/utforska` UtforskaPage | traditioner → ämnen, register | **replace** – ersätts av Bibliotekets landningssida (`library.md`): Frågor, Teman, Rum, Källor, Traditioner, Sparat — frågor och teman före personer och traditioner |
| `/bibliotek*`, `/kapitel/*`, `/bibliotek-sok` | verk → bok → kapitel-läsare, FTS-sök, offline | **keep/adapt** – blir Bibliotekets källsektion; kapitel­läsaren behålls, sorteras in under den nya bibliotekshierarkin |
| `/amne/$id` AmnePage | ämnesnav med "vägar in", personer, relaterat | **replace** – ersätts av temasidor och frågesidor i Biblioteket |
| `/kalla/$id` KallaPage | kuraterad originaltext (atlasens 7 källor) | **adapt** – blir källsidor enligt `source-and-context.md`, kopplade till kanoniska källposter |
| `/tidslinje` | vertikal tidslinje, 12 händelser | **remove som toppnivå** – `room-schema.md` har tidslinje som valfritt rumsinnehåll; en global tidslinje kan återkomma som sekundär biblioteksvy vid behov |
| `/personer`, `/person/$id` | personregister + personsidor | **adapt** – personer blir stödposter i Biblioteket, inte en primär ingång ("idéerna före auktoriteterna", `library.md` §Primary Organization). Traditionsraderna på PersonerPage länkar i dag alla till `/utforska` (platshållare) |
| `/atlas` AtlasPage | SVG-konceptkarta, 12 noder | **remove** – tunn och självrefererande (flera noder pekar på samma ämne); relaterade frågor i rummen (`related_questions`) fyller funktionen |
| `/samling` SamlingPage | bokmärken + anteckningar + mörkt läge-knapp | **adapt** – blir "Sparat" enligt `notes-and-saved.md`; utseendeinställningen flyttar till Inställningar (dubblerar i dag ReadingSettingsSheet) |
| `/sok` SokPage | klientsök över atlasinnehåll | **replace** – ersätts av det genererade sökindexet i Fas 10 (`search.md`) |
| Bottennav: Hem · Utforska · Texter · Atlas · Samling | `src/components/NavTabs.tsx`, döljs i läslägen | **replace** – ny minimal navigering: Läsrummet · Biblioteket · Sparat · Inställningar. Mönstret att dölja navigeringen i läsläge (`NAVLESS_PREFIXES` i `RootLayout.tsx`) behålls |

---

# 3. Komponenter

Det mesta i `src/components/` är direkt återanvändbart i läsrummet:

| Komponent | Klassificering | Kommentar |
| --- | --- | --- |
| `BottomSheet` | **adapt** | delat ark-skal med scrim och "Klar"-knapp; saknar fokusfälla, Escape-stängning och fokusåtergång — åtgärdas innan Fas 3 godkänns (a11y-kriterierna) |
| `NotesSheet` | **adapt** | anteckningsark per ämne; byter nyckel till rums-id, autosparande finns redan via storen |
| `ReadingSettingsSheet` / `ReadingSettingsButton` | **keep** | typsnitt, textstorlek, bakgrund, tema — matchar specarnas tillåtna personalisering |
| `BookmarkButton` | **keep** | tyst bokmärkning, ingen räknare — i linje med `notes-and-saved.md` |
| `TopBar` | **keep** | tillbaka-knapp + åtgärdsplats |
| `RowLink` | **keep** | den återkommande listraden; bärande i hela Biblioteket |
| `ToLink` / `LinkedParagraph` | **adapt** | `To`-unionen byggs om när innehållsmodellen byts (rum/fråga/tema/källa i stället för topic/person) |
| `NavTabs` | **replace** | se navigation ovan |
| `Icons` | **keep** | återhållsamt inline-SVG-set, inga emojis |

---

# 4. Styling och designtokens

`src/styles/global.css` + `src/lib/theme.ts`.

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| Folianten-paletten (papper `#faf6ed`, bläck, accent `#772f35`), EB Garamond, tokens på `.desk` | **keep** | stämmer väl med `06-design-principles.md`: varmt, boklikt, lugnt |
| Mörkt läge via `data-dark`, systemtema när ovalt | **keep** | |
| Läsartypografi (`--rs`-skala 16–23 px, versradstorlek) | **keep** | grunden för läsrummets layout |
| `prefers-reduced-motion`-globalt stopp, diskreta fade/sheet-animationer | **keep** | |
| 430 px-centrerat skal | **investigate** | mobilupplevelsen är rätt, men `home-and-entry.md` §Desktop vill att större skärm känns som ett större läsrum — beslut behövs om skalet ska andas mer på desktop |
| Färgvärden duplicerade i `theme.ts`, `global.css` och pre-paint-skriptet i `index.html` | **adapt** | medvetet (kommenterat) men skört; en enda källa vore bättre när tokens ändå ses över i Fas 1 |

---

# 5. Innehållsmodellen — största gapet

`src/content/model.ts` mot `room-schema.md` och roadmapens `ReflectionRoom`-typ.

Dagens `Topic` (id, title, tradition, min, intro, essay, context, sources, related, people)
saknar **allt** som bär den nya modellen:

- ingen mänsklig fråga (`question`, `primaryQuestionId`)
- inga teman
- ingen "tanke att bära" (`takeaway`)
- inga reflektionsfrågor
- ingen redaktionell status (`draft/review/published/archived`)
- inga strukturerade källrelationer (citat/översättning/parafras/bearbetning)
- ingen valideringsnivå alls — innehållet är typat men inget kontrollerar relationer,
  slugs eller obligatoriska fält vid bygge

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| `Topic`-modellen och `topics/` (6 ämnen) | **replace** (modellen) / **investigate** (texterna) | modellen ersätts av rumsschemat med validering (Fas 2). Essäerna är genomarbetade och tematiskt nära de nya temana (lidandet, själen, stoicism …) — beslut behövs om de omarbetas till de första rummen eller arkiveras; se Öppna frågor |
| `sources.ts` (7 kuraterade källor) | **adapt** | blir utgångspunkt för kanoniska källposter, men saknar användningstyp, upphovsrättsstatus, passagereferenser och osäkerhetsmarkering (`source-and-context.md`) |
| `people.ts` (7), `traditions.ts` (6) | **adapt** | blir stödposter i Biblioteket utan egna toppnivåsektioner initialt (roadmapen Fas 6) |
| `quotes.ts` + dagens citat | **remove** | `home-and-entry.md` §Daily Content: dagligt innehåll ska inte vara hemupplevelsen; lösryckta citat strider mot källfilosofin |
| `timeline.ts` (12 händelser) | **remove som egen modell** | tidslinje är valfritt rumsinnehåll i `room-schema.md` |
| `atlasMap.ts` (konceptkartan) | **remove** | se `/atlas` ovan |

Innehållsformat framåt: roadmapen förordar Markdown med front matter så att redaktionellt
arbete inte kräver kodändringar. Dagens TS-moduler duger för ett mycket litet första set,
men valideringen (Fas 2) bör byggas mot det format som ska gälla långsiktigt.

---

# 6. State och lagring

`src/lib/store.tsx` + `storage.ts`, allt i localStorage-nyckeln `visdomsatlasen`.

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| Lokal lagring först, ingen server för personligt | **keep** | exakt vad `notes-and-saved.md` föreskriver |
| Bokmärken (ämnen) + kapitelbokmärken | **adapt** | ämnesbokmärken migreras till rums-id; kapitelbokmärken behålls |
| Anteckningar per ämne med autospar | **adapt** | migreras till rum; koppling till ursprunget finns redan |
| `lastRead` | **adapt** | behålls som *sekundär* orientering ("nyligen öppnat"); får inte längre ta över hemskärmen |
| Tema/typsnitt/storlek/bakgrund | **keep** | |
| Export/import av personligt data | **saknas** | krav i Fas 9 (`notes-and-saved.md` §Export); README listar det redan som nästa steg |

---

# 7. Backend och biblioteket

`server/` — Hono + better-sqlite3 + Drizzle + FTS5.

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| Hono-server, SPA + `/api`, Tailscale-only, ingen inloggning | **keep** | |
| Schema works/books/verses + FTS5 (`server/db/schema.ts`) | **keep** | blir källgrunden för `source-and-context.md`; `works` har redan `license`, `translation`, `translated` — användningstyp och osäkerhet hör hemma i den *redaktionella* källmodellen (Fas 2/8), inte nödvändigtvis i denna tabell |
| Ingest med 12 verk och utbytbara adaptrar (`server/ingest/`) | **keep** | Bibeln 1917, Dhammapada, Självbetraktelser, Tao Te Ching, Enchiridion, Zhuangzi, Epiktetos samtal, Senecas dialoger, båda Eddorna, Analekterna, Försvarstalet |
| AUTO_INGEST vid boot, tokenskyddad `/api/ingest`, timing-safe jämförelse | **keep** | |
| Maskinöversättning via Ollama (`server/ingest/translate.ts`) | **investigate** | `source-and-context.md` §Translation Policy kräver att översättningens karaktär redovisas för läsaren. `works.translated` finns och visas, men gränssnittsmärkningen behöver granskas mot specen i Fas 8. Notera: standardmodellen `gemma4:31b-cloud` i `translate.ts`/`.env.example` ser ut som en platshållare |
| FTS5-verssök (`server/library/search.ts`) | **keep/adapt** | diakritik-okänslig, prefixmatchning, snippet-markering — god grund; Fas 10:s publika sökindex för rum/frågor/teman är ett separat, klientgenererat index |
| Drizzle-kit-konfig (`drizzle.config.ts`) | **remove eller dokumentera** | pekar på `server/db/migrations` som inte finns; migreringar körs som handskriven idempotent SQL i `migrate.ts`. Vestigial i praktiken |
| Schemadrift: `verses_work_idx` skapas i `migrate.ts` men saknas i `schema.ts` | **adapt** | rättas i förbifarten (Fas 1) |
| `fetchJson`/`fetchText` (`server/lib/`) | **adapt** | nästan identiska retry-dupletter; slås ihop vid tillfälle, inget blockerande |

---

# 8. Sök

Två inkonsekventa implementationer i dag:

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| Bibliotekssök: server-FTS, debounce 250 ms, grupperade träffar | **keep** | |
| Atlassök (`src/lib/search.ts`): substring-skanning, ingen debounce, ingen rankning | **replace** | ersätts av Fas 10:s genererade index med svensk normalisering, alias och grupperade ändliga resultat |

---

# 9. Offline, PWA och prestanda

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| vite-plugin-pwa, Workbox: precache av app-skal + runtime-cache av `/api/library*` (SWR, 120 dagar) | **keep** | |
| Offline-nedladdning av alla kapitel med progress + radering (`src/lib/offline.ts`) | **keep** | persisterad flagga sedan PR #8 |
| Fontstrategi: självhostad EB Garamond, woff2 CacheFirst | **keep** | |
| Manifest-ikoner: bara `icon.svg`, inga PNG/maskable | **adapt** | känd lucka (README), hör till Fas 13 |
| Framtida krav: hemskärm + ett urval rum offline (`home-and-entry.md` §Offline) | — | dagens mekanik täcker biblioteket; rummen får motsvarande cache-strategi när de finns |

---

# 10. CI och deploy

| Del | Klassificering | Kommentar |
| --- | --- | --- |
| CI: `npm run check` + bygge + fixture-ingest-rök på varje PR | **keep** | testkommandot läggs till i CI när testrunnern finns (Fas 1) |
| Deploy: GHCR-image → Tailscale → Hetzner, pull-fel failar, gamla images rensas | **keep** | härdad i PR #9 |
| Dockerfile: tre steg, servern körs med `tsx` direkt | **keep** | de inkopierade tsconfig-filerna används inte i drift — kosmetiskt |

---

# 11. Tillgänglighet och mobil (input till Fas 11)

Finns redan: en `h1` per sida, `aria-label` på ikonknappar, `role="dialog"`/radiogroups i arken,
`aria-pressed`/`aria-live` där det behövs, `:focus-visible`-token, reduced motion.

Kända luckor att bära in i Fas 3/11:

- ingen fokusfälla, Escape-stängning eller fokusåtergång i `BottomSheet`
- ingen skip-länk
- `aria-current` saknas i navigeringen
- ingen error boundary (fel visas bara som inline-text via `StateNote`)
- layout via inline-`style` på spans på flera ställen

---

# 12. Funktioner i konflikt med den nya riktningen

Samlad lista (klassificering ovan):

1. **Dagens citat på hemskärmen** — dagligt innehåll som tröskelupplevelse (förbjudet i `home-and-entry.md`).
2. **"Fortsätt där du var" på hemskärmen** — specen: tröskeln börjar alltid i nuet; senast läst blir sekundär orientering.
3. **Datumhälsningen** — tidsberoende hemskärm avråds.
4. **Hemfrågan "Vad vill du utforska idag?"** — utforskningsspråk; ersätts av "Vad vill du bära med dig idag?" (reflektion).
5. **Femfliksnavigeringen** — fler primära destinationer än den nya modellen tillåter.
6. **Atlas-konceptkartan som toppnivå** — utforskning för sin egen skull.
7. **Personregistret som primär ingång** — auktoriteter före idéer.
8. **Tidslinjen som toppnivå** — historia före frågor.

Ingen gamification, inga strecks, inga räknare eller emojis hittades — de dyraste
konflikterna finns alltså inte i kodbasen.

---

# 13. Övrig teknisk skuld (ej blockerande)

- README är föråldrad: listar 4 verk i biblioteket, servern har 12 registrerade.
- Dubblerad mörkt läge-kontroll (SamlingPage + ReadingSettingsSheet).
- `ScreenId`-unionen bär oanvända fall (`sok`, `utforska`).
- En `eslint-disable`-kommentar i `useAsync.ts` utan att ESLint är konfigurerat.

---

# Öppna frågor som behöver ägarens beslut

1. **Atlassessäernas framtid.** De sex ämnena (historiska Jesus, stoicism, Egypten, själen,
   Predikaren, lidandet) ligger tematiskt nära de nya temana. Rekommendation: använd dem som
   *råmaterial* för de första reflektionsrummen (omarbetade genom `publish-room.md`-checklistan)
   i stället för att behålla en separat atlassektion. Alternativet — två parallella
   innehållsuniversum — strider mot "one thought at a time".
2. **Bibliotekets läsare i den nya informationsarkitekturen.** Verk → bok → kapitel-läsaren
   fungerar och behålls, men var den bor i Bibliotekets nya sektioner (under "Källor"?) avgörs
   när `library.md` implementeras i Fas 6.
3. **Maskinöversättningarna.** Elva av tolv verk är Ollama-översatta. Räcker dagens
   »översatt«-märkning för `source-and-context.md`:s ärlighetskrav, eller ska rummens
   citat bara få dras ur verk med granskad översättning? Påverkar publiceringsgrinden i Fas 8.
4. **Desktopskalet.** Behålls 430 px-skalet överallt, eller får läsrummet en bredare,
   fortfarande lugn desktoplayout?
5. **Innehållsformat.** Markdown med front matter (roadmapens förord) eller fortsatt typade
   TS-moduler för det första lilla rumssettet? Avgör hur Fas 2-valideringen byggs.

---

# Rekommenderad väg in i Fas 1

Grunden att bygga vidare på: hela `server/`, kvalitetssviten, designtokens och läsartypografin,
BottomSheet-familjen, bokmärkes-/anteckningsstoren, PWA/offline och CI/deploy.

Fas 1 bör i tur och ordning:

1. lägga till en testrunner (vitest) och koppla in den i `npm run check` och CI
2. besluta lint-nivån (ESLint eller dokumenterat fallow+tsc)
3. skapa innehållskatalogen för rum enligt beslutet i öppen fråga 5
4. rätta schemadriften (`verses_work_idx`) och ta bort/dokumentera drizzle-kit-konfigen
5. lämna all borttagning av atlasskärmar till dess de nya ytorna ersätter dem —
   appen ska vara körbar efter varje steg

---

# Verifiering av Fas 0-kriterierna

- [x] Den nuvarande applikationsstrukturen är dokumenterad (avsnitt 1–10).
- [x] Befintliga återanvändbara komponenter är identifierade (avsnitt 3, 4, 6, 7).
- [x] Funktioner i konflikt med den nya riktningen är listade (avsnitt 12).
- [x] Inga större arkitekturbeslut vilar på overifierade antaganden — det som inte kan
      avgöras i kod är markerat *investigate* och samlat under Öppna frågor.

Kodbasens nuläge bekräftat med `npm run check` (grönt: typer, 100 % type-coverage,
komplexitet, död kod) 2026-07-11.
