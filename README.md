# dotyoujee / Ops Log

Small IT consultancy in Kampala, plus a cybersecurity apprenticeship built in
public. The whole site runs on one rule:

> No receipt, no points.

## What this is

Two things live on one domain:

1. **The consultancy** — small-scope IT work I can honestly deliver today:
   asset inventories, account and permission clean-up, backups, SPF/DKIM/DMARC,
   MFA rollout, compliance starter checklists, awareness sessions and simple
   hardened static sites.
2. **The apprenticeship** — a dependency-ordered curriculum and journal where
   progress only counts when a post links to evidence: a writeup, a CTF flag,
   a certification ID, or a commit.

There is no SOC, no invented certification, no fake scanner and no "100% pass
rate". If a claim has no receipt, it is not on this site.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Front door: consultancy + progress snapshot |
| `learn.html` | Curriculum map / skill tree, locked and complete states |
| `blog.html` | Journal index with search and type filters |
| `post.html?slug=...` | Renders one Markdown journal entry |
| `contact.html` | Briefing form with in-page confirmation and explicit handoff |
| `privacy.html`, `terms.html` | Plain-language legal pages |

## How progress works

Source of truth:

- `data/tracks.json` — tracks, modules, prerequisites, XP values, levels, repos.
- `journal/*.md` — dated posts with frontmatter. `_template.md` is the template.
- `scripts/build.py` — reads both, checks evidence, counts real commits through
  the GitHub API, and writes generated data.
- `data/progress.json`, `data/posts.json` — generated, committed, public.

XP rules:

| Source | XP | Requirement |
|--------|----|-------------|
| Lab | 60 | Evidence URL |
| Writeup | 120 | Evidence URL |
| CTF / platform completion | 80 | Evidence URL |
| Certification | 500 | Verifiable ID URL |
| Module | its own value | Listed in `completed`, pays once ever |
| Commit | 2 each, 40/week cap | Public repo configured in tracks.json |
| Meta / notes | 0 | Always |

Ranks (Recruit → Initiate → Operator → Analyst → Engineer → Architect) are game
levels, not credentials.

## Add an entry

```bash
cp journal/_template.md journal/0002-my-lab.md
# fill frontmatter: title, date, type, track, evidence, completed, summary
python3 scripts/build.py
git add journal data && git commit -m "journal: add lab writeup"
```

Alternatively, just push the post: `.github/workflows/build-progress.yml`
regenerates and commits `data/*.json` automatically.

## Run locally

```bash
python3 -m http.server 8123
# open http://localhost:8123
```

A server is required because the pages `fetch()` the generated JSON. `file://`
will not work.

## Layout

```
├── index.html, learn.html, blog.html, post.html
├── contact.html, privacy.html, terms.html
├── assets/app.css, app.js, contact.js
├── data/tracks.json, progress.json, posts.json
├── journal/*.md
├── scripts/build.py
├── compliance-checklists/   # free reference material
├── scanner/                 # the actual nmap-based scanner tool
├── docs/testing-playbook.md # safe testing procedure
└── archive/README.md        # why the old site was removed
```

## Deployment

GitHub Pages via `.github/workflows/pages.yml` on push to `main`. The progress
data workflow runs first when journal files change.

© 2026 dotyoujee · Mugagga Moses · Kampala
