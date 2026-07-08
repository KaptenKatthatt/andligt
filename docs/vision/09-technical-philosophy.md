Teknisk filosofi
Tekniken är inte produkten

Visdomsatlasen är i grunden inte ett teknikprojekt.

Tekniken finns för att bära innehållet.

Om tekniken någon gång står i vägen för upplevelsen har vi valt fel teknisk lösning.

Innehållet är evigt

Ramverk kommer och går.

Bibliotek byts ut.

AI-modeller utvecklas.

Men innehållet ska kunna leva vidare.

Därför ska innehållet alltid vara oberoende av implementationen.

Content First

Allt innehåll ska leva utanför gränssnittet.

UI läser innehåll.

UI äger inte innehåll.

Inga texter ska skrivas direkt i React-komponenter.

Portabilitet

Visdomsatlasens innehåll ska kunna flyttas till:

en ny frontend
en mobilapp
en e-bok
en PDF
ett API
en framtida AI

utan att behöva skrivas om.

Mänskligt läsbara format

Innehåll ska lagras i öppna och lättlästa format.

Exempel:

Markdown

MDX

YAML

JSON

eller andra öppna standarder.

Proprietära databaser ska inte vara den enda sanningen.

Git är biblioteket

Git är inte bara versionshantering.

Git är projektets historia.

Alla förändringar av innehåll ska kunna följas över tid.

Det ska vara enkelt att se:

vad som ändrades

varför det ändrades

vem som ändrade det

AI är ett verktyg

AI är en medarbetare.

Inte en beslutsfattare.

AI får:

hjälpa

strukturera

föreslå

sammanfatta

granska

översätta

AI avgör aldrig ensam vad som publiceras.

Små byggstenar

Systemet ska byggas av små, tydliga delar.

Varje komponent ska ha ett tydligt ansvar.

Varje fil ska vara enkel att förstå.

Komplexitet ska delas upp.

Inte döljas.

Enkelhet framför smarthet

Vi väljer den enklaste lösningen som löser problemet väl.

Teknisk elegans handlar inte om avancerad kod.

Den handlar om att nästa utvecklare förstår systemet direkt.

Läsbar kod

Kod skrivs för människor.

Kompilatorn är bara en bonus.

Om kod känns imponerande men svår att förstå är den sannolikt för komplicerad.

Stabilitet framför nyhet

Nya bibliotek ska inte användas bara för att de är nya.

Vi föredrar teknik som:

är beprövad

är väldokumenterad

har ett aktivt community

är enkel att underhålla

Offline först

Visdomsatlasen ska fungera även utan internet så långt det är praktiskt möjligt.

Att läsa ett rum ska inte kräva ständig uppkoppling.

Kunskap ska finnas nära användaren.

Snabbhet genom enkelhet

Appen ska kännas snabb.

Inte genom avancerad optimering.

Utan genom att göra mindre.

Mindre JavaScript.

Mindre animationer.

Mindre beroenden.

Mindre komplexitet.

AI-vänlig struktur

Projektet ska organiseras så att både människor och AI enkelt kan förstå det.

Det innebär:

tydliga mappar

tydliga namn

tydliga ansvar

konsekvent struktur

god dokumentation

Dokumentationen är en del av systemet

Kod utan dokumentation är ofullständig.

Dokumentation ska beskriva:

varför

inte bara

hur.

Innehållet får aldrig låsas

En användare ska alltid kunna exportera sina egna anteckningar.

Projektets innehåll ska kunna säkerhetskopieras.

Kunskap ska inte vara inlåst.

Teknik ska kunna bytas ut

Om frontend en dag byts från React till något annat ska innehållet fortsätta fungera.

Om AI-modellen byts ska arbetsflödet fortsätta fungera.

Systemet ska vara modulärt.

Säkerhet genom enkelhet

Färre beroenden.

Färre tjänster.

Färre integrationer.

Mindre attackyta.

Lång livslängd

Visdomsatlasen byggs med ambitionen att leva i många år.

Vi undviker därför lösningar som kräver ständig omskrivning.

Teknik väljs med långsiktighet som främsta kriterium.

AI-agenter

Hermes, Codex och framtida AI-agenter ska behandlas som utvecklare i projektet.

De ska alltid:

läsa dokumentationen först

förstå filosofin

respektera manifestet

följa projektets struktur

motivera större förändringar

Ingen AI får börja implementera utan att först förstå projektets vision.

Teknisk skuld

Teknisk skuld accepteras endast när den är medveten.

Tillfälliga lösningar ska dokumenteras.

Det ska alltid finnas en plan för hur de kan ersättas.

Den sista regeln

Om två tekniska lösningar ger samma upplevelse väljer vi den enklare.

Den enklaste lösningen är oftast den mest hållbara.

Teknologier är utbytbara

Visdomsatlasen definieras inte av:

React

TypeScript

TanStack

Vite

Hermes

Claude

Codex

eller någon annan teknik.

De är verktyg.

Projektets identitet ligger i dess innehåll, dess filosofi och den upplevelse det ger användaren.

Jag vill faktiskt föreslå en liten ändring jämfört med hur många teknikdokument skrivs.

Jag skulle undvika att nämna specifika bibliotek här, även om ni använder dem idag. De hör bättre hemma i en separat teknisk specifikation eller README. Det här dokumentet ska fortfarande kännas sant om fem år när ni kanske använder helt andra verktyg.

Jag tror faktiskt att det här är ett av de mest tidlösa dokumenten vi har skrivit. Det handlar inte om React eller AI – det handlar om ett förhållningssätt till teknik. Och det passar väldigt bra ihop med resten av Visdomsatlasens filosofi: tekniken ska vara nästan osynlig, precis som designen.
