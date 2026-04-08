# Wonder Car Design — Project Rules

## Project Overview
초등학생용 3D 럭셔리 자동차 디자인 웹앱.
- Spec: `docs/superpowers/specs/2026-04-08-wonder-car-design.md`
- Plan: `docs/superpowers/plans/2026-04-08-wonder-car-implementation.md`

## Implementation Workflow (MANDATORY)

Every task follows this exact sequence. NO shortcuts.

### Step-by-Step Process
1. **Write code** for the current step
2. **Syntax verify** — Run `bash scripts/verify-syntax.sh` after every file write
3. **Build verify** — Run `bash scripts/verify-build.sh` after completing each task
4. **Consistency verify** — Run `bash scripts/verify-consistency.sh` after each task
5. **Browser test** — Start dev server, open browser via chrome-devtools MCP, take screenshot, verify visually
6. **Regression test** — Verify ALL previously completed pages still work (not just the current task)
7. **Fix** — If any verification fails, fix immediately before proceeding
8. **Commit** — Only after all verifications pass

### Verification Checklist (Run after EVERY task)
```
[ ] scripts/verify-syntax.sh passes
[ ] scripts/verify-build.sh passes
[ ] scripts/verify-consistency.sh passes
[ ] npm run dev starts without errors
[ ] Browser: Landing page loads (http://localhost:3000)
[ ] Browser: Studio page loads (http://localhost:3000/studio)
[ ] Browser: Gallery page loads (http://localhost:3000/gallery)
[ ] Browser: All previously working features still work
[ ] No console errors in browser DevTools
```

## Tech Stack
- Frontend: React 18 + react-three-fiber + drei + Zustand + Vite
- Backend: Node.js + Express + better-sqlite3
- Styling: CSS with custom properties (theme.css)

## Code Conventions

### File Organization
- client/src/components/ — React components (PascalCase.jsx + .css pairs)
- client/src/hooks/ — Custom hooks (useXxx.js)
- client/src/data/ — Static data (camelCase.js)
- server/routes/ — Express route handlers

### CSS Theme Variables (defined in theme.css)
```
--bg-primary: #0a0a0a      (main background)
--bg-secondary: #111111    (panels)
--bg-tertiary: #1a1a1a     (cards, inputs)
--border: #222222           (borders)
--border-hover: #333333     (hover borders)
--accent: #c9a84c           (gold accent)
--text-primary: #f0f0f0     (main text)
--text-secondary: #999999   (secondary text)
--text-muted: #666666       (muted text)
```
ALWAYS use these variables. NEVER hardcode colors in component CSS.

### Store (Zustand)
- All design state lives in client/src/store.js
- Components access store via `useStore((s) => s.specificKey)`
- NEVER use useState for state that should be shared across components

### API Client
- All API calls go through client/src/api.js
- NEVER use fetch() directly in components

### 3D Components
- CarViewer.jsx — Canvas wrapper (do not add scene content here)
- CarModel.jsx — Car model loading + material application
- StudioLighting.jsx — Lighting setup (do not modify without full scene review)

## Responsive Breakpoints
- Desktop: >= 1024px (3-panel layout)
- Tablet: 768px - 1023px (collapsed left panel)
- Mobile: < 768px (bottom sheet)

## Import Path Rules
- Use relative imports within client/src/
- Component to component: `import X from './X'`
- Component to store: `import useStore from '../store'`
- Component to API: `import { fn } from '../api'`
- Component to data: `import { x } from '../data/carCatalog'`

## Before Committing
1. ALL three verification scripts must pass
2. Dev server must start cleanly
3. Browser must load all existing pages
4. No hardcoded colors (use CSS variables)
5. No direct fetch() calls (use api.js)
6. No local state for shared data (use store.js)
