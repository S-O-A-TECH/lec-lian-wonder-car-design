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
5. **Interactive browser test** — Start dev server, use playwright MCP tools to:
   - Navigate to each page
   - Click buttons and links
   - Fill form inputs
   - Verify page transitions work
   - Take screenshots for visual verification
   - Check console for errors
6. **Regression test** — Re-test ALL previously completed pages interactively (not just current task)
7. **Fix** — If any verification fails, fix immediately before proceeding
8. **Commit** — Only after all verifications pass

### Interactive Browser Test Protocol (MANDATORY after each task)

Use playwright MCP tools (`browser_navigate`, `browser_click`, `browser_snapshot`,
`browser_take_screenshot`, `browser_fill_form`, `browser_evaluate`,
`browser_console_messages`) to perform these checks.

**Phase 1: Smoke test every page**
```
[ ] Navigate to http://localhost:3000 — verify landing page renders
[ ] Navigate to http://localhost:3000/studio — verify studio renders
[ ] Navigate to http://localhost:3000/gallery — verify gallery renders
[ ] Check browser console — zero errors allowed
```

**Phase 2: Interactive test for current task's feature**
Test the specific feature just implemented by actually clicking, typing, and interacting.
Document what was tested and what the result was.

**Phase 3: Full regression — re-test ALL previous features**
Go back and interactively test every feature from previous tasks:
```
[ ] Landing page: click "디자인 시작하기" → navigates to /studio
[ ] Landing page: click "갤러리 구경하기" → navigates to /gallery
[ ] Studio: nickname modal appears if no nickname set
[ ] Studio: enter nickname → modal closes
[ ] Studio: click brand → brand highlights, model list appears
[ ] Studio: click model → 3D car loads/changes
[ ] Studio: change color → car color updates in 3D view
[ ] Studio: change finish → car surface updates
[ ] Studio: click Undo → reverts change
[ ] Studio: click Redo → re-applies change
[ ] Studio: click Save Image → downloads PNG
[ ] Studio: click Share to Gallery → creates design, navigates to detail
[ ] Gallery: cards display with thumbnails
[ ] Gallery: click Latest/Popular → list re-sorts
[ ] Gallery: click card → navigates to design detail
[ ] Detail: 3D viewer loads with saved design
[ ] Detail: like button works (toggle)
[ ] Detail: back to gallery button works
```
Only check items that have been implemented so far.
Skip items from tasks not yet completed.

**Phase 4: Mobile responsive test**
```
[ ] Resize browser to 375px width (mobile)
[ ] Verify bottom sheet appears instead of side panels
[ ] Verify 3D canvas fills screen
[ ] Resize back to 1280px (desktop)
[ ] Verify 3-panel layout restored
```

### Script Verification Checklist (Run after EVERY task)
```
[ ] scripts/verify-syntax.sh passes
[ ] scripts/verify-build.sh passes
[ ] scripts/verify-consistency.sh passes
[ ] npm run dev starts without errors
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
