# Harbor Foundry — Operating dashboard

Dedicated repo target: **harbor-foundry** (GitHub Pages).

**Live URL:** https://elephantharbor.github.io/harbor-foundry/

Public-safe Cycle 3 operating view for Thomas. Plain English. No secrets. Snapshot is the only data source for the SPA.

## Local preview

```bash
cd site   # or repo root if this folder is the Pages root
python3 -m http.server 8080
```

Open http://localhost:8080 — `file://` will not load `data/snapshot.json` (fetch requires HTTP).

## GitHub Pages

1. Push this site as the **harbor-foundry** repo (or copy `site/` contents to that repo root).
2. Settings → Pages → Build from branch **main** → folder **/ (root)**.
3. Confirm https://elephantharbor.github.io/harbor-foundry/

Do **not** invent sales, Proceed/Retarget/Kill, or open gates. Wren pushes; do not push from this sprint pack unless asked.

## Portfolio tile

Wells updates portfolio `data/segments/foundry.json` from `data/segment-summary.json` (contract fields: `mission`, `dashboardState`, `publicLinks`, headline metrics, lesson Experience→Evidence→Learning→Change, `needsHumanAction` genuine-only).

## Structure

```
index.html
static/styles.css
static/app.js
data/snapshot.json
data/segment-summary.json
README.md
```

Views: Overview · Pipeline · Ventures · Evidence & Decisions · Lessons · Docs.
