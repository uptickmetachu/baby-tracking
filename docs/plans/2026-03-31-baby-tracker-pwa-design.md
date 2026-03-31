# Baby Tracker PWA Design

## Overview
A progressive web app hosted on GitHub Pages for tracking baby sleep times and feeds. Mobile-first, offline-capable, no backend.

## Tech Stack
- Vanilla HTML/CSS/JS (no build step)
- Chart.js via CDN for graphs
- LocalStorage for persistence
- Service worker for offline PWA support

## File Structure
```
baby-tracking/
├── index.html          # Single HTML file with all markup
├── style.css           # Mobile-first styles
├── app.js              # Core logic, tab switching, data management
├── charts.js           # Chart.js graph rendering
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
```

## Data Model (LocalStorage)
Each day keyed as `baby-YYYY-MM-DD`:
```json
{
  "baby-2026-03-31": {
    "sleeps": [
      { "id": "s1", "start": "09:30", "end": "10:45", "note": "" }
    ],
    "feeds": [
      { "id": "f1", "time": "08:00", "volume": 120, "note": "" }
    ]
  }
}
```
Durations and daily totals calculated on the fly.

## UI Layout (3 Tabs)

### Tab 1 — Log (default)
- Date picker at top (defaults to today, navigate to any day)
- "Sleep" section: list of entries with edit/delete, "Add Sleep" form (start, end, note)
- "Feeds" section: list of entries with edit/delete, "Add Feed" form (time, volume mL, note)
- Duration auto-calculated per sleep entry
- Daily totals at bottom of each section

### Tab 2 — Today
- Summary card: total sleep hours, total feed volume
- Chronological timeline of sleeps and feeds interleaved

### Tab 3 — Trends
- Date range selector (7 / 14 / 30 days)
- Bar chart: daily total sleep duration
- Bar chart: daily total feed volume

## PWA Support
- Service worker with cache-first strategy
- manifest.json with standalone display mode
- Icons at 192px and 512px

## Deployment
- GitHub Pages from main branch root
- No build step or CI required
