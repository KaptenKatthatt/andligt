# Översättningsflöde för klassiska zentexter

Forskningsrapport för Visdomsatlasen. Frågan: hur skapar vi egna svenska
översättningar av äldre japanska och kinesiska zentexter (public domain) med
hjälp av Ollama Cloud-modeller via Hermes-gatewayen — vilken modell, vilket
arbetsflöde, och med vilka skyddsräcken?

Testdatum: 2026-07-13. Experimentkod och rådata: `docs/research/zen-experiment/`
(passager med proveniens, samtliga modellutdata) och `scripts/zen-experiment/`
(körbart harness). Allt i denna rapport som kräver specialistverifiering är
markerat **[kräver specialistgranskning]**.

---

## 1. Exekutiv rekommendation

- **Primär översättningsmodell: `deepseek-v3.2:cloud`.** Enda modellen som levererade
  kompletta svar i alla flöden på alla fem passager, med den mest disciplinerade
  filologin: redovisade läsningsalternativ, ärligast konfidensangivelser (3–4 med
  motiverade svagheter, där gemma4 satte 5 på svar med påvisbara fel) och lägst
  hallucinationsfrekvens. Svagheten är svensk morfologi under tryck ("återvorde",
  "avförestapp") — den mänskliga språktvätten är obligatorisk, inte valfri.
- **Granskningsmodell: `glm-5.1:cloud`.** Gav de filologiskt bästa korsgranskningarna
  när den levererade (fångade bl.a. inverterad kärnmetafor i P1 och didaktisk
  utslätning i P2). Viktig reservation: *ingen* granskarmodell är pålitlig nog att
  agera grind ensam — varje granskare producerade minst en självsäker falsk positiv
  eller en hallucinerad granskning (se §5). Granskningsfynd är uppslag för mänsklig
  kontroll, aldrig facit.
- **Rekommenderat flöde: C (analytiskt) — analys först, sedan svensk översättning ur
  analysen, direkt från originalet.** C höjde golvet mest konsekvent: svagare modeller
  disciplinerades märkbart av analyssteget (gemma4:s bästa utdata var C på fyra av fem
  passager) och tvetydighetsapparaten blev bäst. Därtill flöde D (korsgranskning) som
  obligatoriskt men människoverifierat steg.
- **Engelska som mellanled: nej som standard.** Flöde B gav enstaka toppresultat
  (bästa enskilda översättning på tre passager, alltid med deepseek eller glm), men
  varje fel i det engelska mellansteget propagerade till svenskan trots uttrycklig
  instruktion att verifiera mot originalet — dokumenterade exempel finns på alla fem
  passagerna (se §4). Risken är systematisk och svår att upptäcka i efterhand;
  nyttan är tillfällig. Undantag: en engelsk arbetsöversättning får gärna *sparas som
  dokumentation* (transparens), men ska inte vara översättarens underlag.
- **Största begränsningar:** (1) Alla slutsatser bygger på fem korta passager och en
  körning per cell — små underlag, inga upprepningar; (2) utvärderingen är gjord av
  AI (Claude) mot ordböcker och etablerade översättningar, inte av en specialist på
  klassisk japanska/kinesiska — **[kräver specialistgranskning]**; (3) resonerande
  modeller kräver stor tokenbudget (≥16k) — med för liten budget levererar de tomma
  eller trunkerade svar (upptäcktes och åtgärdades under experimentet, se §5);
  (4) kontots Ollama-kvot begränsar hur mycket som kan köras per session;
  (5) modellversioner är färskvara — omtest krävs vid modellbyte.

---

## 2. Källtabell

| # | Författare | Verk | Datering | Källspråk | Upphovsrätt (original) | Svårighet | Skäl för urval |
|---|---|---|---|---|---|---|---|
| P1 | Hakuin Ekaku (1686–1769) | Zazen wasan (坐禅和讃) | ca 1750-tal | Tidigmodern japanska (7-5-vers) | Public domain (död 1769) | Enkel | Enkel undervisningstext för lekfolk; testar ton och naturlig svenska |
| P2 | Wumen Huikai (1183–1260) | Wumenguan/Mumonkan, fall 7 med kommentar och vers | 1228 | Klassisk kinesiska (läst som kanbun) | Public domain (1228) | Medel | Kōan + kommentar; tre register; öppen segmentering i Taishō-interpunktionen |
| P3 | Dōgen (1200–1253) | Shōbōgenzō: Genjōkōan, öppningen | 1233 | Klassisk japanska (wabun) | Public domain (död 1253) | Svår | Språkligt svåraste författaren; omdiskuterade termer (豊倹, 跳出) |
| P4 | Linji Yixuan (d. 866); red. 1120 | Rinzai-roku: 無位真人-passagen | 800-tal/1120 | Klassisk kinesiska med Tang-talspråk | Public domain | Svår | Tung buddhistisk terminologi; filologiskt omtvistade ord (赤肉團, 面門, 乾屎橛) |
| P5 | Dōgen (1200–1253) | Shōbōgenzō: Uji, öppningen | 1240 | Kanbun-citat + klassisk japanska | Public domain (död 1253) | Mycket svår | Genuint tvetydigt nyckelord (有時); språkbyte mitt i passagen |

Fullständig proveniens (utgåva, transkriptionskälla med länk, PD-motivering,
transkriptionsanmärkningar) ligger i `docs/research/zen-experiment/passages/*.json`.
Kinesiskan är teckenexakt ur Taishō-utgåvan via CBETA:s XML
([T48n2005](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T48/T48n2005.xml),
[T47n1985](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml));
japanskan är kryssverifierad mot flera oberoende transkriptioner men bör
kollationeras mot SAT-databasen eller tryckt utgåva före publicering
**[kräver specialistgranskning]**.

Viktig distinktion: *originalen* är fria; *moderna utgåvors* interpunktion,
kanaval och styckeindelning är redaktionella tillägg (Taishō 1924–34, CBETA,
Iwanami). Vi återger utgåvans text med attribution och dokumenterar det som
utgåveberoende — inte som del av 1200-talstexten.

## Jämförelsereferenser (konsulterade, aldrig kopierade)

Etablerade översättningar användes som riktmärken vid poängsättningen, med
exakt attribution och utan att deras formuleringar återanvänds i föreslagna
svenska texter:

- *The Record of Linji*, öv. Ruth Fuller Sasaki, red. Thomas Yūhō Kirchner
  (University of Hawai'i Press, 2009) — standardutgåvan med Iriya Yoshitakas
  och Yanagida Seizans filologi ([UH Press](https://uhpress.hawaii.edu/title/the-record-of-linji/)).
- Norman Waddell & Masao Abe, *The Heart of Dōgen's Shōbōgenzō* (SUNY Press, 2002) —
  Genjōkōan och Uji.
- Kazuaki Tanahashi (red.), *Treasury of the True Dharma Eye* (Shambhala, 2010) —
  Genjōkōan och Uji ([förlagssida](https://www.shambhala.com/dogen/)).
- Shōhaku Okumura, *Realizing Genjōkōan* (Wisdom Publications, 2010) — kommentar
  ([Wisdom](https://wisdomexperience.org/product/realizing-genj%C5%8Dk%C5%8D/)).
- Katsuki Sekida, *Two Zen Classics: Mumonkan and Hekiganroku* (Weatherhill, 1977)
  och Zenkei Shibayama, *Zen Comments on the Mumonkan* (Harper & Row, 1974) — Mumonkan.
- Översiktskatalog över Genjōkōan-översättningar:
  [thezensite](http://www.thezensite.com/ZenTeachings/Dogen_Teachings/GenjoKoan8.htm).

Någon etablerad svensk översättning av Dōgen eller Rinzai-roku hittades inte i
sökningen (2026-07-13); svenskan bedöms därför mot norm för svensk sakprosa och
mot de engelska standardöversättningarnas semantik, inte mot en svensk
föregångare. **[kräver specialistgranskning om svensk utgåva finns]**

Terminologi kontrollerades mot fritt tillgängliga ordboksverk, främst Soothill &
Hodous, *A Dictionary of Chinese Buddhist Terms* (1937, public domain) samt
öppna poster i Digital Dictionary of Buddhism (buddhism-dict.net).

---

## 3. Modelljämförelse

*(fylls i efter experimentkörningen; exakta modelltaggar, kontextlängder och
datum dokumenteras maskinellt i `results/modeller.json`)*

---

## 4. Flödesjämförelse

**Flöde A (direkt).** Helt beroende av modellens egen disciplin: utmärkt med deepseek
(bästa enskilda översättning på P5, komplett apparat), sämst med gemma4 (namnfelet
"Zhōu Zhōu" i P2, "vissnar" för växer i P3, barnhallucinationen i P5 — alla med hög
konfidens). Direktflödet ger minst transparens: när det går fel finns inget spår av
varför.

**Flöde B (engelskt mellanled).** Det mest tveeggade resultatet i experimentet. Å ena
sidan producerade B tre av fem passagers bästa enskilda översättningar (deepseek B på
P1, glm B på P2 och P3) — en bra engelsk arbetsöversättning fungerade där som
verklig kvalitetshöjare, och avvikelseavsnittet visade att modellen faktiskt
kontrollerade mot originalet. Å andra sidan var felpropagering från det engelska
steget systematisk: gemmas engelska "sentient beings are near" gav inverterat subjekt
i svenskan (P1), "those who over-explain" förgiftade kommentartolkningen (P2), "grass
withers" gav "vissnar" (P3), "the head" flyttade den filologiska debatten till fel
kroppsdel (P4) och "staff-sweeping child" blev "stav-sopande barn" (P5). Instruktionen
att verifiera mot originalet hjälpte de starka modellerna men inte de svaga — och det
är just de svaga som behöver den. Slutsats: **engelskt mellanled förbättrar taket men
sänker golvet; för en produktionspipeline där enskilda fel är dyra är det fel byte.**

**Flöde C (analytiskt).** Höjde golvet mest konsekvent: gemma4:s och qwens bästa
utdata var C-flödet på nästan alla passager, tvetydighetsredovisningen var
genomgående bäst (t.ex. redovisade tre av fyra modeller 者僧-frågan i P2 endast i C),
och analyssteget gav redaktionellt användbart material (segmentering, termdiskussion,
olösta osäkerheter). Två viktiga förbehåll: analysen kan *inducera* fel som sedan
propagerar (glossan "lämna vattnet" gav inverterad kärnmetafor i tre C-utdata på P1;
gemmas analys födde den uppdiktade Dao-läsarten av 道道 i P4), och för den starkaste
modellen tillförde C ibland inget över A (deepseek på P3 blev sämre i C än i A).
**C rekommenderas som produktionsflöde** därför att dess vinster (golv, apparat,
transparens) väger tyngre än dess risker, som den mänskliga granskningen är bäst
rustad att fånga just eftersom analysen är synlig.

**Flöde D (korsgranskning).** Gav verkligt värde minst en gång per passage — bl.a.
fångades den inverterade vattenmetaforen (P1), "Gå då och skålen" (P2), den
monistiska felläsningen av われにあらざる (P3), 丈六-måttfelet och den dolda
有時-tvetydigheten (P5) — men var också experimentets farligaste komponent när den
gick fel: granskare recenserade *tomma* översättningar som om de fanns och
rekommenderade dem som bäst (P2, P4), och underkände korrekta översättningar med
självsäker felaktig filologi (道道 "allvarligt fel" i P4, 生仏-domen i P3).
**D behålls i pipelinen som felgenerator för mänsklig kontroll — aldrig som
automatisk grind.**

---

## 5. Felanalys

Kategoriserade huvudfynd (fler exempel med belägg i agentprotokollen; alla utdata i
`results/`):

**Språkfel.** deepseek under morfologiskt tryck: "återvorde", "avfödslesticka",
"avförestapp", "skitpinn" (P4); glm: "buddhavisen" för buddhavägen (P3, ×2),
"skittpinne", "lanterna"; gemma: "peak" kvar oöversatt i svensk text (P5); qwen:
"Funkerar", "metaphoriskt" (P1-analysen). Mönster: även de bästa modellerna
producerar icke-ord i svåra passager — svensk språktvätt är ett obligatoriskt
pipelinesteg.

**Begreppsfel.** Allvarligast: gemma "gräset *vissnar*" för 草は…おふる = *växer*
(P3, i alla tre flöden — vänder Dōgens poäng); glm/deepseek/gemma inverterade
villkorslogiken i 水を離れて氷なく (P1, C-flödet); gemma 道道 som "Säger, säger"
i stället för imperativt "Tala! Tala!" (P4); glm "en shaku och sex" för 丈六 =
sexton fot (P5); deepseek "inte skilda från mig själv" för われにあらざる = "inte
är jag" — negation blev monism (P3).

**Stilproblem.** Mildring av det grova 乾屎橛 till "avföringspinne" med motiveringen
"klinisk precision" (gemma, P4) — grovheten är textens poäng; kristnande "Paradiset"
för 蓮華国 (deepseek, P1); didaktiska expansioner av den avsiktligt oexplikerade
slutbilden i Genjōkōan (deepseek A, P3).

**Hallucinationer.** gemma: "Ibland borstar man bort barn med en stav" ur 杖払子 =
"staven och flugviskan" (P5, försvarat som "bokstavlig återgivning"); gemma:
liknelsen attribuerad till "Sutra om det gyllene ljuset" i stället för Lotussutran
(P1); gemma: uppdiktad Dao-läsart av 道道 presenterad som filologisk tvetydighet
(P4); deepseek: "klockljudet … dunklet från en lerkruka" — utbroderat utöver 喚鐘作甕
(P2). Värst av allt: granskarmodeller som recenserade tomma översättningar och
rekommenderade dem (P2, P4) — konfabulation i själva kvalitetskontrollen.

**Omotiverad säkerhet.** gemma satte konfidens 5 på svar med namnfel, verbfel och
hallucinationer (P1–P5, systematiskt); granskaren i P4 underkände korrekt 道道-
översättning som "allvarligt fel" med nybörjarläsningen som facit; gemma B hävdade
att en felaktig parsning var "bokstavlig" (P1). deepseek var ensam om genomgående
kalibrerad konfidens (3–4 med konkreta svagheter). **Konfidenssiffror från modeller
utan kalibrering är sämre än inga alls** — i produktionsformatet sparas de som
modellutsaga, inte som kvalitetsmått.

**Experimentartefakt (viktig metodlärdom).** I körningen med `num_predict 4096`
levererade de resonerande modellerna (qwen3.5, glm-5.1) tomma eller trunkerade svar
på flertalet passager — tankeblocken åt upp tokenbudgeten och det synliga svaret
försvann. Detta är inte modellkvalitet utan konfiguration: budgeten höjdes till
16 384 och de drabbade cellerna kördes om. Lärdom för pipelinen: sätt hög
tokenbudget, behandla tomma svar som fel med omförsök, och lita aldrig på en
körning utan leveranskontroll.

---

## 6. Rekommenderad produktionspipeline

*(utkast — justeras efter experimentets utfall)*

Repeterbart flöde för en ny textpassage, i linje med
`docs/specs/source-and-context.md`, `docs/checklists/verify-sources.md` och
regeln att AI aldrig publicerar ensamt:

1. **Källverifiering.** Identifiera verk, författare, datering, språktyp.
   Hämta texten ur en spårbar transkription (CBETA/SAT för kanon; namngiven
   utgåva för japanska verk). Dokumentera Taishō-nummer eller motsvarande.
2. **Upphovsrättsverifiering.** Kontrollera originalets PD-status (upphovsmannens
   dödsår) och transkriptionens licens separat. Skilj original från utgåva.
3. **Originaltranskription.** Lägg passagen som teckenexakt fil med
   proveniensmetadata (formatet i `passages/*.json`).
4. **Modellöversättning.** Kör det rekommenderade flödet (se §1) med den
   rekommenderade modellen via Hermes. Ordagrann + läsbar version, tvetydighets-
   och terminologinoter, konfidens.
5. **Terminologiordlista.** För in valda termåtergivningar i en gemensam ordlista
   så att samma term återges lika i hela atlasen; avvikelser motiveras.
6. **Korsmodellsgranskning.** Låt granskningsmodellen (se §1) granska mot
   originalet med granskningsprotokollet (flöde D-prompten).
7. **Mänsklig granskning.** Redaktören läser original, översättning och noter
   mot `docs/checklists/review-language.md` och `verify-sources.md`; vid behov
   konsulteras specialist på klassisk japanska/kinesiska.
8. **Redaktionell slutbearbetning.** Anpassa till Visdomsatlasens ton
   (lugn, seriös, utan att tvetydigheter döljs); notera alla medvetna avsteg.
9. **Proveniensmetadata.** Spara översättningsposten (format i §7) tillsammans
   med rummet/källpassagen; publicering beslutas av ägaren enligt
   redaktionsflödet i CLAUDE.md.

---

## 7. Rekommenderat format för översättningspost

*(utkast — fältet `flode` m.m. låses efter §1)*

JSON (eller frontmatter) per översatt passage, förslagsvis under
`src/content/kallpassager/` när Fas 8 byggs:

```json
{
  "id": "rinzai-mui-shinnin",
  "original": "上堂云：「赤肉團上有一無位真人…",
  "kallreferens": {
    "verk": "Zhenzhou Linji Huizhao chanshi yulu",
    "utgava": "Taishō T47n1985, 0496c10–14",
    "transkription": "CBETA xml-p5 (hämtad 2026-07-13)",
    "lank": "https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml",
    "upphovsratt": "original public domain; interpunktion CBETA"
  },
  "engelskArbetsoversattning": null,
  "svenskOrdagrann": "…",
  "svenskLasbar": "…",
  "terminologinoter": [{ "term": "無位真人", "atergivning": "…", "motivering": "…" }],
  "osakerheter": ["…"],
  "modell": { "namn": "…", "digest": "…", "flode": "…", "datum": "2026-07-13" },
  "granskning": [
    { "typ": "korsmodell", "modell": "…", "datum": "…", "resultat": "…" },
    { "typ": "mansklig", "granskare": "ägaren", "datum": "…", "beslut": "…" }
  ],
  "status": "utkast"
}
```

Principer: originalet och dess proveniens är obligatoriska; den engelska
arbetsöversättningen sparas när den använts (transparens om härledningsvägen);
ordagrann och läsbar version hålls isär; osäkerheter följer med posten hela
vägen till publicering i stället för att strykas under putsningen.

---

## Bilagor

- Rådata: `docs/research/zen-experiment/results/` (alla prompter och svar,
  latenser, modellmetadata).
- Harness: `scripts/zen-experiment/run.ts` (återupptagbar; körs via
  `.github/workflows/zen-experiment.yml`).
- Modellkatalogläget 2026-07: Ollama Cloud omfattar bl.a. deepseek-v3.2 (671B),
  GLM-5.1, Kimi K2.6, Qwen 3.6-familjen, MiniMax M3, gpt-oss och Gemma 4;
  prissättning per abonnemang (Free/Pro/Max, debiterat efter GPU-tid). Källor:
  [Ollama cloud-katalog](https://ollama.com/search?c=cloud),
  [ollama/ollama på GitHub](https://github.com/ollama/ollama),
  [webreactiva: Ollama Cloud-modeller](https://www.webreactiva.com/blog/modelos-ollama-cloud),
  [angelo-lima: Ollama 2026](https://angelo-lima.fr/en/ollama-2026-state-of-the-art-en/).
