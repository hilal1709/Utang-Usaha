# Graph Report - ap-insight  (2026-10-26)

## Corpus Check
- 161 files · ~74,786 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 734 nodes · 1749 edges · 37 communities (27 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Route Handlers
- Validation & Excel Rules
- Report Data & Export
- Login & Auth Config
- Runtime Dependencies
- App Shell & Navigation
- OpCo & Interco Pages
- CMS Tables & Feedback
- CMS Admin Pages
- Category Dashboard Pages
- Package Manifest
- shadcn Config
- Database Schema SQL
- UI Primitives
- TypeScript Config
- Realtime & History
- Dev Dependencies
- Loading & Lottie
- Root Layout & Toasts
- Chart.js Charts
- Lottie Generator Script
- Master Data Editors
- Upload Workspace
- NPM Scripts
- Login Form & Spotlight
- User Management
- Alert UI
- Progress UI
- Unused Sonner Wrapper
- ESLint Config
- Drizzle Config
- Auth Route Exports

## God Nodes (most connected - your core abstractions)
1. `next` - 33 edges
2. `react` - 28 edges
3. `requireUser()` - 24 edges
4. `milyarAuto()` - 20 edges
5. `monthLabel()` - 20 edges
6. `apiUser()` - 20 edges
7. `validateRow()` - 20 edges
8. `lucide-react` - 20 edges
9. `periodLabel()` - 19 edges
10. `cn` - 19 edges

## Surprising Connections (you probably didn't know these)
- `CmsLayout()` --calls--> `requireUser()`  [EXTRACTED]
  app/(cms)/layout.tsx → lib/session.ts
- `DashboardLayout()` --calls--> `auth`  [EXTRACTED]
  app/(dashboard)/layout.tsx → auth.ts
- `updateOpco()` --calls--> `requireUser()`  [EXTRACTED]
  app/(cms)/cms/actions.ts → lib/session.ts
- `upsertVendor()` --calls--> `normKategoriVendor()`  [EXTRACTED]
  app/(cms)/cms/actions.ts → lib/rules/normalize.ts
- `upsertVendor()` --calls--> `normVendorName()`  [EXTRACTED]
  app/(cms)/cms/actions.ts → lib/rules/normalize.ts

## Import Cycles
- None detected.

## Communities (37 total, 10 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.07
Nodes (68): GET(), GET(), maxDuration, GET(), body, issue, maxDuration, POST() (+60 more)

### Community 1 - "Validation & Excel Rules"
Cohesion: 0.05
Nodes (70): cellValue(), readDetailGrid(), sheetToGrid(), Bucket, BUCKETS, FIRST_DATA_ROW, HEADER_ROW, JENIS_PEMBAYARAN (+62 more)

### Community 2 - "Report Data & Export"
Cohesion: 0.09
Nodes (38): GET(), maxDuration, GET(), maxDuration, buildReport(), Cat, emptyBuckets(), EX_INTERCO (+30 more)

### Community 3 - "Login & Auth Config"
Cohesion: 0.08
Nodes (22): login(), LoginState, LoginForm(), metadata, LAYERS, StrataHero(), authConfig, Role (+14 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, animejs, aos, @base-ui/react, bcryptjs, chart.js, class-variance-authority, clsx (+26 more)

### Community 5 - "App Shell & Navigation"
Cohesion: 0.09
Nodes (19): CmsLayout(), DashboardLayout(), signOut, AosInit(), LordIcon(), LordName, LiveProvider(), AppShell() (+11 more)

### Community 6 - "OpCo & Interco Pages"
Cohesion: 0.15
Nodes (19): metadata, Page(), StatusRow(), metadata, BUCKET_STYLE, StrataBar(), StrataLegend(), ExportButton() (+11 more)

### Community 7 - "CMS Tables & Feedback"
Cohesion: 0.19
Nodes (17): BADGE, Issue, Row, ROLE, Row, downloadFrom(), toast, Button() (+9 more)

### Community 8 - "CMS Admin Pages"
Cohesion: 0.17
Nodes (19): setPeriodLock(), ExportPage(), metadata, MasterPage(), LockToggle(), metadata, MonitoringPage(), CmsHome() (+11 more)

### Community 9 - "Category Dashboard Pages"
Cohesion: 0.12
Nodes (13): metadata, metadata, Page(), Page(), metadata, metadata, auth, Key (+5 more)

### Community 10 - "Package Manifest"
Cohesion: 0.08
Nodes (23): name, private, version, clsx, lottie-web, motion, @neondatabase/serverless, react-dom (+15 more)

### Community 11 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 12 - "Database Schema SQL"
Cohesion: 0.14
Nodes (19): "ap_detail", "ap_summary", "ap_vendor_summary", "data_events", detail_submission, issues_submission, "opcos", "periods" (+11 more)

### Community 13 - "UI Primitives"
Cohesion: 0.14
Nodes (7): Badge(), badgeVariants, TabsList(), tabsListVariants, @base-ui/react, class-variance-authority, cn

### Community 14 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "Realtime & History"
Cohesion: 0.20
Nodes (11): MonitoringTable(), HistoryItem, STATUS, SubmissionHistory(), LiveBadge(), LiveContext, LiveEvent, LiveState (+3 more)

### Community 17 - "Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, dotenv, drizzle-kit, eslint, eslint-config-next, tailwindcss, @tailwindcss/turbopack, tsx (+7 more)

### Community 18 - "Loading & Lottie"
Cohesion: 0.21
Nodes (5): cache, Lottie(), LottieName, RouteLoading(), lottie-react

### Community 19 - "Root Layout & Toasts"
Cohesion: 0.17
Nodes (7): app_globals, geistMono, geistSans, metadata, viewport, AppToaster(), TooltipProvider()

### Community 20 - "Chart.js Charts"
Cohesion: 0.31
Nodes (11): HBarChart(), PaymentBars(), rpTooltip(), STATUS_COLORS, StatusDonut(), TrendChart(), AGE_COLORS, C (+3 more)

### Community 21 - "Lottie Generator Script"
Cohesion: 0.31
Nodes (11): json, os, check_layer(), circle_layer(), kf(), Membuat ilustrasi Lottie bermerek AP Insight (lapisan "core sample") ke…, frames: [(t, value_list)] → animated property, rect_layer() (+3 more)

### Community 22 - "Master Data Editors"
Cohesion: 0.26
Nodes (11): ActionResult, deleteVendor(), updateOpco(), upsertVendor(), notify(), OpcoEditor(), OpcoLine(), OpcoRow (+3 more)

### Community 23 - "Upload Workspace"
Cohesion: 0.22
Nodes (9): buildCorrectionWorkbook(), CHECKS, Opco, Phase, post(), ReviewPanel(), Summary, UploadWorkspace() (+1 more)

### Community 26 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, db:generate, db:migrate, dev, lint, start, test (+1 more)

### Community 27 - "Login Form & Spotlight"
Cohesion: 0.39
Nodes (4): CardSpotlight(), Input(), Label(), react

### Community 29 - "User Management"
Cohesion: 0.53
Nodes (6): createUser(), deleteUser(), fail(), newPassword(), resetPassword(), UserManager()

### Community 33 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **214 isolated node(s):** `metadata`, `LAYERS`, `opcoSchema`, `userSchema`, `metadata` (+209 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 319 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Category Dashboard Pages` to `API Route Handlers`, `Login & Auth Config`, `App Shell & Navigation`, `OpCo & Interco Pages`, `CMS Tables & Feedback`, `CMS Admin Pages`, `Package Manifest`, `Realtime & History`, `Loading & Lottie`, `Root Layout & Toasts`, `Master Data Editors`, `Upload Workspace`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `react` connect `Login Form & Spotlight` to `Login & Auth Config`, `App Shell & Navigation`, `OpCo & Interco Pages`, `CMS Tables & Feedback`, `Package Manifest`, `UI Primitives`, `Realtime & History`, `Dropdown Menu UI`, `Loading & Lottie`, `Master Data Editors`, `Upload Workspace`, `Select UI`, `Table UI`, `Popover UI`, `Alert UI`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Manifest`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `metadata`, `LAYERS`, `opcoSchema` to the rest of the system?**
  _214 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06716036772216548 - nodes in this community are weakly interconnected._
- **Should `Validation & Excel Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.05172413793103448 - nodes in this community are weakly interconnected._
- **Should `Report Data & Export` be split into smaller, more focused modules?**
  _Cohesion score 0.09250693802035152 - nodes in this community are weakly interconnected._