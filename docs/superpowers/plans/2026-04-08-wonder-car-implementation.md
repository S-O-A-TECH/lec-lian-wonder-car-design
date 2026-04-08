# Wonder Car Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a 3D luxury car customization web app where elementary school students can select brand base models, swap parts, change colors/finishes, and share designs in a public gallery.

**Architecture:** React SPA with react-three-fiber for 3D rendering, backed by Node.js/Express REST API with SQLite. All 3D rendering is client-side (WebGL). Server handles gallery CRUD and static file serving. Monorepo with client/ and server/ directories.

**Tech Stack:** React 18, react-three-fiber, drei, Three.js, Vite, Node.js, Express, better-sqlite3, multer, Zustand

---

## File Structure

```
wonder-car/
├── package.json                    # Root scripts (dev, build, start)
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── theme.css
│       ├── api.js
│       ├── store.js
│       ├── data/
│       │   └── carCatalog.js
│       ├── components/
│       │   ├── LandingPage.jsx + .css
│       │   ├── NicknameModal.jsx + .css
│       │   ├── Studio.jsx + .css
│       │   ├── BrandPanel.jsx + .css
│       │   ├── PartsPanel.jsx + .css
│       │   ├── Toolbar.jsx + .css
│       │   ├── CarViewer.jsx
│       │   ├── CarModel.jsx
│       │   ├── StudioLighting.jsx
│       │   ├── Gallery.jsx + .css
│       │   ├── GalleryCard.jsx
│       │   ├── DesignDetail.jsx + .css
│       │   └── MobileBottomSheet.jsx
│       └── hooks/
│           └── useScreenshot.js
├── server/
│   ├── package.json
│   ├── index.js
│   ├── db.js
│   └── routes/
│       ├── designs.js
│       ├── models.js
│       └── upload.js
└── .gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: package.json, client/package.json, client/vite.config.js, client/index.html, server/package.json, .gitignore (update)

- [ ] Step 1: Create root package.json with dev/build/start scripts using concurrently
- [ ] Step 2: Create client/package.json with React, react-three-fiber, drei, three, zustand, react-router-dom, Vite
- [ ] Step 3: Create client/vite.config.js with proxy to localhost:4000 for /api and /uploads, build output to server/public
- [ ] Step 4: Create client/index.html with Inter font, ko lang, viewport meta
- [ ] Step 5: Create server/package.json with express, better-sqlite3, multer, cors
- [ ] Step 6: Update .gitignore for node_modules, dist, server/public, server/data, server/uploads, *.db
- [ ] Step 7: Run npm install in root, client, and server
- [ ] Step 8: Commit

## Task 2: Express Server + SQLite Database

**Files:**
- Create: server/db.js, server/index.js

- [ ] Step 1: Create server/db.js — SQLite setup with WAL mode, designs table (id, nickname, title, brand, base_model, parts_config JSON, thumbnail, likes_count, created_at), likes table (id, design_id FK, nickname, created_at, UNIQUE(design_id, nickname))
- [ ] Step 2: Create server/index.js — Express app with cors, JSON body parser (10mb limit), static file serving for /uploads and built React app, API route mounting, SPA fallback, listen on PORT 4000
- [ ] Step 3: Verify server starts
- [ ] Step 4: Commit

## Task 3: API Routes

**Files:**
- Create: server/routes/designs.js, server/routes/upload.js, server/routes/models.js

- [ ] Step 1: Create server/routes/designs.js — GET / (list with sort=latest|popular, page, limit), GET /:id (detail with parsed parts_config), POST / (create with validation), POST /:id/like (toggle with nickname-based dedup)
- [ ] Step 2: Create server/routes/upload.js — POST / with multer for image upload (5MB limit, image/* only), saves to server/uploads with unique filename, returns path
- [ ] Step 3: Create server/routes/models.js — GET / returns full 30-car catalog (13 brands), GET /parts/:category returns parts options for wheels (5), spoiler (4), grille (4), headlights (4), bumper (3), color (10 presets), finish (4 with roughness/metalness values)
- [ ] Step 4: Test all routes respond with curl
- [ ] Step 5: Commit

## Task 4: React App Shell + Routing + Theme

**Files:**
- Create: client/src/main.jsx, client/src/App.jsx, client/src/theme.css, client/src/api.js
- Create: placeholder components (LandingPage, Studio, Gallery, DesignDetail)

- [ ] Step 1: Create client/src/theme.css — CSS variables for luxury dark theme (bg #0a0a0a, accent #c9a84c gold, Inter font), reset, scrollbar styling, responsive breakpoints
- [ ] Step 2: Create client/src/api.js — fetch wrappers for fetchModels, fetchParts, fetchDesigns, fetchDesign, saveDesign, toggleLike, uploadImage (FormData)
- [ ] Step 3: Create client/src/main.jsx — React root with BrowserRouter
- [ ] Step 4: Create client/src/App.jsx — Routes: / (Landing), /studio (Studio), /gallery (Gallery), /design/:id (DesignDetail)
- [ ] Step 5: Create placeholder components returning simple divs
- [ ] Step 6: Verify app runs at localhost:3000
- [ ] Step 7: Commit

## Task 5: Zustand Store + Car Catalog Data

**Files:**
- Create: client/src/store.js, client/src/data/carCatalog.js

- [ ] Step 1: Create client/src/data/carCatalog.js — defaultPartsConfig, finishPresets (roughness/metalness for each), colorPresets array (10 colors with names)
- [ ] Step 2: Create client/src/store.js — Zustand store with: nickname (localStorage persist), selectedBrand/selectedModel, partsConfig object, setPart(category, value) with history push, undo/redo with history array (max 50), canUndo/canRedo computed
- [ ] Step 3: Commit

## Task 6: 3D Car Viewer + Showroom Lighting

**Files:**
- Create: client/src/components/StudioLighting.jsx, client/src/components/CarModel.jsx, client/src/components/CarViewer.jsx

- [ ] Step 1: Create StudioLighting.jsx — 3-point lighting (key from upper-right 1.5 intensity, fill from left 0.6, rim from behind 0.8), ambient 0.15, ground plane (dark reflective), Environment preset="studio"
- [ ] Step 2: Create CarModel.jsx — loads .glb via useGLTF, applies color/finish from store to all meshes (clone materials), includes PlaceholderCar fallback (procedural box-shaped car with 4 wheel cylinders), HEAD-checks model path existence before loading
- [ ] Step 3: Create CarViewer.jsx — Canvas with preserveDrawingBuffer, shadows, PerspectiveCamera at [4,2,6] fov 45, OrbitControls (no pan, min/max distance, limited polar angle), Suspense with wireframe box fallback
- [ ] Step 4: Commit

## Task 7: Screenshot Capture Hook

**Files:**
- Create: client/src/hooks/useScreenshot.js

- [ ] Step 1: Create useScreenshot hook — capture() gets canvas element, calls toBlob, uploads via uploadImage API, returns path. download() creates temp link with toDataURL and clicks it.
- [ ] Step 2: Commit

## Task 8: Design Studio — 3-Panel Layout + All UI Components

**Files:**
- Create: NicknameModal.jsx/.css, BrandPanel.jsx/.css, PartsPanel.jsx/.css, Toolbar.jsx/.css, MobileBottomSheet.jsx, Studio.jsx/.css

- [ ] Step 1: Create NicknameModal — overlay modal, nickname input (1-20 chars), stores via setNickname, auto-focus
- [ ] Step 2: Create NicknameModal.css — centered modal on dark overlay, accent-colored title, themed input/button
- [ ] Step 3: Create BrandPanel — fetches catalog via API, renders brand list (click to expand), model list under selected brand, highlights active selections
- [ ] Step 4: Create BrandPanel.css — panel-width 200px, uppercase labels, hover/active states with accent border, hidden below 1023px
- [ ] Step 5: Create PartsPanel — category tabs (Color, Finish, Wheels, Spoiler, Grille, Lights, Bumper), color grid with swatches + color picker, finish option cards, placeholder message for 3D parts categories
- [ ] Step 6: Create PartsPanel.css — panel-width 220px, tab styling, color swatch grid 5-col, option card grid 2-col, hidden below 1023px
- [ ] Step 7: Create Toolbar — undo/redo buttons (disabled when can't), Save Image (download), Share to Gallery (capture + saveDesign + navigate), Gallery link
- [ ] Step 8: Create Toolbar.css — absolute bottom, gradient background, accent/outline button variants, mobile-responsive sizing
- [ ] Step 9: Create MobileBottomSheet — toggle handle with "Customize" text, open/close state, Brand/Parts tabs, renders BrandPanel or PartsPanel inside, only visible below 1023px
- [ ] Step 10: Replace Studio.jsx — shows NicknameModal if no nickname, 3-panel flex layout (BrandPanel + center CarViewer+Toolbar + PartsPanel), MobileBottomSheet overlay
- [ ] Step 11: Create Studio.css — full viewport, flex layout, responsive column on mobile
- [ ] Step 12: Verify studio loads with all panels
- [ ] Step 13: Commit

## Task 9: Landing Page

**Files:**
- Replace: client/src/components/LandingPage.jsx, Create: LandingPage.css

- [ ] Step 1: Create LandingPage.jsx — full-viewport hero with 3D canvas background (auto-rotating placeholder car with showroom lighting), overlaid title "WONDER CAR" (gold accent), subtitle, two CTA buttons (design start + gallery), popular designs section below (fetches top 4)
- [ ] Step 2: Create LandingPage.css — hero 100vh, large title 72px (40px mobile), gold accent, CTA buttons with hover scale, popular grid responsive, mobile-friendly
- [ ] Step 3: Verify landing page
- [ ] Step 4: Commit

## Task 10: Gallery Page

**Files:**
- Replace: Gallery.jsx, Create: Gallery.css, Create: GalleryCard.jsx

- [ ] Step 1: Create GalleryCard.jsx — card with thumbnail image (16:9), title, author nickname, likes count with accent color, click navigates to /design/:id
- [ ] Step 2: Replace Gallery.jsx — header with back button + title + sort buttons (Latest/Popular), grid of GalleryCards, empty state with CTA, pagination (prev/next + page counter)
- [ ] Step 3: Create Gallery.css — auto-fill grid min 280px, card hover effects (border + translateY), mobile 1-column, pagination centered
- [ ] Step 4: Verify gallery page
- [ ] Step 5: Commit

## Task 11: Design Detail Page

**Files:**
- Replace: DesignDetail.jsx, Create: DesignDetail.css

- [ ] Step 1: Replace DesignDetail.jsx — fetches design by id, left side 3D Canvas with OrbitControls showing the car with saved parts_config colors applied, right sidebar with designer name, brand, model, color preview swatch, finish, like toggle button, "new design" button
- [ ] Step 2: Create DesignDetail.css — flex layout (canvas flex-1 + sidebar 300px), info sections with uppercase labels, like/edit buttons full-width, mobile column layout (50vh canvas + sidebar below)
- [ ] Step 3: Commit

## Task 12: End-to-End Integration Test

- [ ] Step 1: Run npm run dev, test full flow: Landing -> Studio (nickname) -> select brand/model -> change color/finish -> undo/redo -> save image -> share to gallery -> gallery list -> design detail -> like -> mobile responsive test
- [ ] Step 2: Fix any issues found
- [ ] Step 3: Commit

## Task 13: Production Build Verification

- [ ] Step 1: Run cd client && npm run build — verify output in server/public
- [ ] Step 2: Run cd server && node index.js — verify full app served from Express at localhost:4000
- [ ] Step 3: Commit
