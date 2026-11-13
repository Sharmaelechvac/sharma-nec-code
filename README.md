# NEC Code — Sharma Electric & HVAC

A separate code app for Sharma electricians. **Not part of Electrician 101.**
Basis: NEC 2020 (Florida Building Code, 8th Edition). All explanations in our own
plain words with article/section citations — no verbatim NFPA text.

## Status: LIVE (Sanjay said "Go live" in his own words, 2026-11-11)
- Live at https://sharmaelechvac.github.io/sharma-nec-code/ — content still DRAFT until Mike Holt checks it; banner stays until he clears it.
- All content is DRAFT until Mike Holt (master electrician) checks it.
- Steve Wozniak reviews the build.

## Structure
- `index.html`, `styles.css`, `app.js` — the app (phone-first, English only, no prices).
- `content/` — Mike Holt's content files (delivered via this GitHub repo):
  - `lookup.json` — code topics (v1: the most-used front section)
  - `checklists.json` — room checklists
  - `calc-tables.json` — calculator reference tables
  - `quiz.json` — quiz / exam-prep questions
  - `sharma-rules.json` — Sharma rules (labeled, stricter than code)
  The app loads these files; placeholders ship until Mike's versions land.

## v1 scope (this build)
Code lookup (priority topics), 5 working calculators (box fill, conduit fill,
voltage drop, ampacity, 220.82 residential load calc), room checklists,
quiz mode, Sharma rules layer, search + favorites.

## Later waves
Rest of Chapters 1–9, troubleshooting guides, wiring diagrams (3-way/4-way,
GFCI/AFCI, panels, subpanels, generators, EV, solar, pools), motor & HVAC
basics, Ohm's law & formulas, wire color codes, tool/safety (OSHA/NFPA 70E),
inspection checklists, Florida-specific rules, FL journeyman/master exam prep.

## Open item
Sharma rule SR-6 (microwave circuit) wire material/size is PENDING Mike Holt's
ruling: 12 AWG copper vs the Sharma CCA standard (10 AWG CCA for 20A).

## Field Book (DRAFT branch `field-book-draft` — NOT merged, NOT live)
- Chapter 1 (General, Arts. 90/100/110) built into the app as book pages in the
  00-COMMON `book-v1` format: `content/book/c1.json` (+ `c1-lookup.json`,
  `c1-quiz.json`, `c1-checklists.json` companions), rendered by the 📕 Field Book
  tab with TOC, index and prev/next. 65 pages, 1 unverified page flagged in-file.
- Chapter 9 (Tables and Informative Annexes — Tables 1/4/5/8, conduit fill and
  voltage drop, Annex C/D/I) added the same way: `content/book/c9.json`
  (+ `c9-lookup.json` 50 entries, `c9-quiz.json` 24 questions, `c9-checklists.json`
  10 items). 20 pages; 3 pages flagged UNVERIFIED in-file (Table 9, Annex D,
  Annex I — no values published for those). The Field Book tab now carries a
  chapter picker and renders every chapter staged on this branch
  (1, 2, 4, 7, 9) with its own TOC, index and prev/next chain.
- Status: DRAFT for Mike Holt review. Merging this branch to `main` is the
  go-live step and happens only on Sanjay's OK in his own words.
