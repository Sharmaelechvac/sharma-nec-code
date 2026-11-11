# NEC Code — Sharma Electric & HVAC

A separate code app for Sharma electricians. **Not part of Electrician 101.**
Basis: NEC 2020 (Florida Building Code, 8th Edition). All explanations in our own
plain words with article/section citations — no verbatim NFPA text.

## Status: REVIEW BUILD — NOT LIVE
- Nothing is published. No GitHub Pages. Goes live only on Sanjay's own OK.
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
