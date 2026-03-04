# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Add Ctrl/Cmd + click and drag panning functionality to `ResumeCanvas`.
- Introduce `DragInput` component in `PropertiesPanel` to enable value scrubbing for numeric inputs.
- Implement status message feedback for layout saving and PNG export operations in `LayoutEditor` (issue #0).
- Add `viewBox` and `filled` properties to icon element types in `shared/layout-types.ts`.
- Add `padding` property to `TextProps` in `layout-types.ts` (`[horizontal, vertical]` tuple, defaults to `[20, 10]` px) for configurable text box internal padding.
- `MoveHandle` component: draggable circular handle with 4-arrow icon rendered at top-center of single selected elements in `ResumeCanvas`, enabling easier element repositioning.
- Grid snap-to support: `snapToGrid` prop on `ResumeCanvas` rounds element drag-end coordinates to the nearest grid line via `snapDragEnd()` callback; enabled automatically when grid is visible.
- Arrow key nudging now snaps to grid when grid is visible, moving elements by `gridSize` (default 10px) and aligning to nearest grid line.
- Stroke width slider (0-10px, 0.5px steps) in `ColorTools` for shapes and dividers, with `getCurrentStrokeWidth()` and `setStrokeWidth()` helpers.
- Layout style extraction for document generation: `extractLayoutStyles()` in `document-generator.ts` scans saved layout text elements by `dataBinding` path, extracting font family, size, color, weight, style, and alignment into `LayoutStyles`.
- `buildPdfStylesFromLayout()` and `buildDocxStylesFromLayout()` convert extracted layout styles to pdfmake and docx library format respectively.
- `loadLatestLayout()` in `layout-handlers.ts` returns the most recently updated saved layout (sorted by `updatedAt`), used by all four document generation IPC handlers to apply user's visual design to generated PDFs and DOCX files.
- "Layout Designer" tab in Sidebar navigation with paintbrush icon, opening a Canva-like visual resume design editor
- Interactive canvas powered by `konva` + `react-konva` rendering a US Letter (612x792pt) resume page with zoom (scroll wheel), grid overlay toggle, and page drop shadow
- Drag-and-drop positioning for all canvas elements with Konva Transformer resize/rotate handles on selection
- Multi-select support (Shift+click) with group transform, click-outside-to-deselect, and keyboard shortcuts: Delete (remove), Ctrl+Z (undo), Ctrl+Shift+Z (redo), Arrow keys (nudge 1px/10px)
- Left sidebar tool panel with 5 tabbed sections: Text (heading/subheading/body/label presets + font/size/style/alignment/color/line-height/letter-spacing controls), Shapes (rect/square/circle/ellipse/line + horizontal/vertical dividers), Images (upload via Electron file dialog + built-in icon library), Colors (18-color preset palette + custom hex picker + stroke color + opacity slider), Templates (4 preset layouts with thumbnail previews)
- Right properties panel showing position (X/Y), size (W/H), rotation slider, locked/visible toggles, layer controls (bring to front/send to back), duplicate, and delete for selected elements
- 4 built-in resume templates: **Modern** (two-column with navy header and light gray sidebar matching reference PDF), **Classic** (single-column with serif fonts and traditional layout), **Creative** (bold indigo/amber colors with asymmetric layout), **Minimal** (clean whitespace with monochrome design)
- Resume data auto-population: text elements with `dataBinding` property automatically populate from ResumeData fields (personalInfo, workExperience, education, skills, certifications) via `useResumeToLayout` hook
- Inline text editing: double-click any text element to open an HTML textarea overlay with matching font/size/color/alignment styles, committed on blur or Escape
- Undo/redo history stack (50 entries max) with debounced state capture for rapid changes (drag operations) via `useLayoutHistory` hook
- Canvas state management via `useCanvasState` hook: zoom (0.25x-3x), pan, selection, grid visibility and snap settings
- 8 built-in SVG resume icons: phone, email, location, LinkedIn, web, GitHub, briefcase, graduation cap
- Profile photo upload via Electron file dialog with circular crop mask and base64 data URL rendering
- Image persistence: uploaded images saved to `~/.job-hunt/images/` directory
- Layout persistence: save/load layouts as JSON to `~/.job-hunt/layouts/` via IPC handlers (`layout:save`, `layout:load`, `layout:list`, `layout:delete`)
- PNG export at 2x resolution via `stage.toDataURL()` with auto-save to Downloads folder
- Layout name input field in the editor toolbar for naming saved layouts
- IPC handlers in main process for layout CRUD operations and image file picker (`layout:pick-image`, `layout:export-png`)
- Preload bridge exposing `saveLayout`, `loadLayout`, `listLayouts`, `deleteLayout`, `pickImage`, and `exportPng` methods
- TypeScript declarations for all layout IPC result types (`LayoutSaveResultIPC`, `LayoutLoadResultIPC`, `LayoutListResultIPC`, `LayoutDeleteResultIPC`, `PickImageResultIPC`, `ExportPngResultIPC`)
- Complete type system in `layout-types.ts`: `ResumeLayout`, `LayoutElement`, `ElementType` (text/shape/image/divider/section/icon), `TextProps`, `ShapeProps`, `ImageProps`, `DividerProps`, `SectionProps`, `IconProps`, `TemplateDefinition`, `IconDefinition`
- Canvas element renderers: `CanvasText`, `CanvasShape` (rect/circle/ellipse/line), `CanvasImage` (with circular clip mask support), `CanvasDivider`, `CanvasIcon` (SVG path scaling), and `CanvasElementRenderer` type-to-component mapper
- Dark mode support across all tool panels, properties panel, and toolbar (canvas page always renders on white background)
- `konva@^9.3.22` and `react-konva@^18.2.10` added as dependencies in desktop package
- npm workspaces monorepo with two packages: `@job-hunt/core` and `@job-hunt/desktop`
- Shared TypeScript base config (`tsconfig.base.json`) targeting ES2022 with strict mode enabled
- Root-level build, test, lint, and format scripts that operate across all workspaces
- JSearch API client with typed request/response interfaces for the RapidAPI JSearch endpoint
- Automatic retry logic with exponential backoff (up to 3 retries) and 429 rate-limit handling
- API quota tracking via `X-RateLimit-Requests-Remaining` response header
- Job detail fetching by job ID (`getJobDetails`)
- Comprehensive TypeScript types for all 42 JSearch API fields: job results, salary, experience/education, employer contact (website, LinkedIn), geo-coordinates, highlights, ONET/NAICS classification, and apply options
- Client-side post-filter engine with support for salary range, include/exclude keywords, company exclusion, and direct-apply-only filtering
- Job deduplication by normalized title, company, and city
- Local JSON storage layer persisted to `~/.job-hunt/data.json` for saved jobs, search profiles, and seen-job tracking
- Full CRUD operations for saved jobs (save, list, remove) and search profiles (save, list, get, remove)
- Seen-job ID set for cross-session deduplication via `markJobsSeen` / `getSeenJobIds`
- Barrel-file re-exports of all public API surfaces from package entry point
- Self-imposed rolling-window rate limiting: 50 requests/week and 200 requests/month, persisted to local storage
- `RateLimitError` class with typed `quota` payload and human-readable reset timestamps
- `recordApiRequest()`, `getQuotaStatus()`, and `checkRateLimit()` storage functions for tracking and enforcing limits
- Pre-flight rate limit check in `JSearchClient.request()` before any HTTP call; automatic recording after successful responses
- Public `JSearchClient.getQuotaStatus()` method exposing current usage
- Electron desktop application built with Electron Forge + Vite plugin
- React 18 renderer with Tailwind CSS, migrated from previous web dashboard
- Electron main process with `contextIsolation: true` and `nodeIntegration: false` security settings
- IPC handlers in main process for `api:search`, `api:job-details`, and `api:quota` channels
- Preload script exposing typed `window.electronAPI` via `contextBridge.exposeInMainWorld`
- TypeScript declarations for `window.electronAPI` with typed IPC request/response interfaces
- `useJobSearch` hook communicates via IPC instead of HTTP fetch
- API key stays secure in the main process (never exposed to renderer)
- SearchForm component with fields for query, location, remote-only, direct-apply-only, employment type, date posted, and experience level
- Collapsible advanced filters panel for salary range, include keywords, and exclude keywords
- JobList, JobCard, JobDetail, SavedJobs, and Header components carried forward from web dashboard
- localStorage persistence for saved/bookmarked jobs on the client side
- Header component with hamburger menu button for sidebar navigation
- Sidebar navigation with Search, Saved Jobs, Resume Builder, and Settings views with quota display
- Resume Builder with collapsible form sections for Personal Information, Work Experience, Education, Skills, and Certifications
- `useResume` hook with IPC-based persistence to `~/.job-hunt/resume.json` and manual Save/Reset workflow with dirty-tracking
- IPC channels `resume:save`, `resume:load`, `resume:pick-file`, and `resume:parse-text` for file-based resume storage and two-step upload parsing in main process
- Two-step Upload Resume flow: file picker extracts text from PDF/DOCX via `pdf-parse`/`mammoth`, then a separate IPC call parses with Gemini Flash 2.5 AI and pre-populates Resume Builder fields
- Processing modal overlay with spinner shown only during the AI parsing step (not during the file dialog)
- AI-powered resume parser (`gemini-parser.ts`) using Gemini Flash 2.5 API with structured JSON output, in-memory rate limiting (2 calls/min), response normalization, and `toTitleCase` sanitization for ALL CAPS names
- Gemini prompt extracts skills from work experience responsibilities and achievements (not from a "Skills" section), building a pool of professional skills relevant to positions held
- Em dash/en dash prohibition: `stripDashes()` utility replaces Unicode em dashes (U+2014) and en dashes (U+2013) with hyphens across all Gemini outputs (resume parser, resume generator, CV generator)
- Gemini API key management in Settings: input, save/remove, encrypted storage at `~/.job-hunt/gemini-key.enc` via Electron `safeStorage`
- IPC channels for Gemini key management: `settings:save-gemini-key`, `settings:get-gemini-key-status`, `settings:remove-gemini-key`
- "AI Resume Parsing" section in Settings with Gemini API key input and "How to Get" guide
- Upload error banner in Resume Builder showing parse failures and missing Gemini key guidance
- AI-tailored Resume generation: "Resume" button in JobDetail modal uses Gemini AI to generate a concise 1-2 page PDF with professional summary, ATS-optimized keyword mirroring, and tailored bullet points based on Resume Builder data and job posting details
- AI-tailored CV generation: "CV" button in JobDetail modal generates a comprehensive multi-page PDF with objective statement and all experience/education/certifications, tailored to emphasize relevant qualifications
- `document-generator.ts` module with Gemini prompt builders (`buildResumePrompt`, `buildCVPrompt`), pdfmake PDF layout builders (`buildResumePdfLayout`, `buildCVPdfLayout`), and generation orchestrators (`generateTailoredResume`, `generateTailoredCV`)
- ATS optimization in AI prompts: mirror exact job posting phrasing, standard section headers, measurable achievements, spell out acronyms, no creative formatting
- PDF generation via `pdfmake` library with Helvetica fonts, single-column ATS-friendly layout, 40px margins, and clean formatting
- Auto-save generated PDFs to user's Downloads folder with `FirstName LastName - Position Resume.pdf` / `FirstName LastName - Position CV.pdf` naming, then auto-open in default PDF viewer via `shell.openPath()`
- IPC channels `document:generate-resume` and `document:generate-cv` with Gemini key validation, resume data validation, and error handling
- `GenerateDocResultIPC` type with `success`, `filePath`, `error`, and `geminiKeyMissing` fields
- Resume/CV buttons disabled when no resume data saved (with tooltip guidance) and during generation (with "Generating..." loading state)
- Success/error message banner in JobDetail footer showing download filename or error details
- `pdfmake.d.ts` type declaration for pdfmake module (PdfPrinter, TFontDictionary, PdfKitDocument)
- DOCX résumé and CV export: new "DOCX Résumé" and "DOCX CV" buttons in JobDetail footer generate Word (.docx) documents using the `docx` library, mirroring existing PDF layout with Calibri font, ATS-friendly Heading styles, and matching sections (contact header, professional summary/objective, work experience, education, skills, certifications)
- DOCX layout builders (`buildResumeDocxLayout`, `buildCVDocxLayout`) and `generateDocxBuffer()` in `document-generator.ts` with `docx` library Paragraph/TextRun API, producing ATS-compatible .docx documents
- DOCX orchestrators (`generateTailoredResumeDocx`, `generateTailoredCVDocx`) reuse existing Gemini prompts and sanitization logic, only differing in final document rendering
- IPC channels `document:generate-resume-docx` and `document:generate-cv-docx` with full Gemini key and resume data validation, auto-save to Downloads folder with `.docx` extension, and auto-open in default Word viewer
- Preload API methods `generateResumeDocx` and `generateCVDocx` exposed to renderer via contextBridge
- Existing "Resume" and "CV" buttons renamed to "PDF Résumé" and "PDF CV" with proper French accent (résumé / é = U+00E9)
- Generating state expanded from 2 to 4 variants (`resume-pdf`, `cv-pdf`, `resume-docx`, `cv-docx`) with `apiMap` lookup for clean dispatch
- Unit tests for DOCX layout builders (`buildResumeDocxLayout`, `buildCVDocxLayout`) and orchestrators (`generateTailoredResumeDocx`, `generateTailoredCVDocx`) in `document-generator.test.ts`
- IPC handler tests for `handleGenerateResumeDocx` and `handleGenerateCVDocx` covering Gemini key missing, no resume data, success path, and error path
- Component tests for new DOCX buttons (render, disable, click, loading modal) and updated label assertions for renamed PDF buttons in `JobDetail.test.tsx`
- `ElectronAPI` type updated with `generateResumeDocx` and `generateCVDocx` method signatures
- Manual Save button replacing auto-save: persists resume data to disk on explicit click
- Reset button: reverts Resume Builder form to last-saved state
- "Saved" badge appears only after explicit save (or when data loaded from disk) and hides when form is modified
- Shared type definitions extracted to `src/shared/resume-types.ts` for cross-process type sharing
- Dynamic add/remove for work experience entries with nested responsibility bullet points
- Dynamic add/remove for education and certification entries
- Tag-based skill input with Enter key and button support
- "Current" checkbox on work experience and education entries that disables end date field
- Settings screen with General (dark mode toggle) and API (RapidAPI key management) categories
- Dark mode with class-based Tailwind CSS toggling, persisted to localStorage via `useSettings` hook
- API key input with validation: key is tested against JSearch API before saving, with success/error feedback
- "How to Get" expandable guide in Settings explaining how to obtain a RapidAPI key
- API key encrypted at rest using Electron `safeStorage` (with plaintext fallback when keyring unavailable), stored at `~/.job-hunt/api-key.enc`
- IPC channels for API key management: `settings:save-api-key`, `settings:get-api-key-status`, `settings:remove-api-key`
- DevTools auto-open in development mode (`!app.isPackaged`)
- Dark mode variants across all renderer components (SearchForm, JobList, JobCard, JobDetail, SavedJobs, Header, Sidebar, Settings)
- Cross-platform packaging via Electron Forge makers (Squirrel for Windows, DMG for macOS, deb for Linux)
- Pagination: 25 results per page with Previous/Next controls; each page costs 1 API request (`num_pages=3`, sliced to 25)
- `useJobSearch` hook exposes `currentPage`, `hasMore`, and `goToPage()` for page navigation
- JobList pagination bar with disabled-state handling, page indicator, and scroll-to-top on page change
- External links (Apply, job publisher URLs) open in the user's default browser via `shell.openExternal`
- `setWindowOpenHandler` and `will-navigate` listeners on `BrowserWindow` to intercept external navigation
- Entire JobCard is now clickable to open the job detail modal (not just the title)
- JobDetail modal sized to 80% of viewport (`w-[80vw] h-[80vh]`) with flex layout and scrollable body
- Clicking the backdrop overlay closes the JobDetail modal
- "Contact & Links" section in JobDetail modal showing employer website, LinkedIn profile, and Google Jobs link when available
- Employer company type displayed alongside company name in JobDetail header (e.g., "Acme Corp · Technology")
- "Posted X ago" relative timestamp in JobDetail header metadata
- Expiration notice banner in JobDetail body: amber for upcoming, red for expired listings
- Combined "Requirements" section in JobDetail showing experience level, education, and experience-in-place-of-education note
- Occupational categories displayed as purple tags in JobDetail modal
- Job highlights sections (Qualifications, Responsibilities, Benefits) rendered as bulleted lists from API-structured data
- Non-English posting language badge in JobDetail header (hidden for English listings)
- GitHub Actions CI pipeline (`.github/workflows/ci.yml`) with parallel lint, typecheck, and test jobs followed by matrix build for Windows, macOS, and Linux
- GitHub Actions release pipeline (`.github/workflows/release.yml`) triggered on `v*.*.*` tags, building all platforms and creating a draft GitHub Release with artifacts and CHANGELOG-extracted release notes
- `latest.yml` and `latest-mac.yml` auto-updater manifests generated during release builds with SHA512 hashes for `electron-updater` verification
- Platform-specific build scripts: `build:win`, `build:mac`, `build:linux` in desktop `package.json`
- `electron-updater` integration with GitHub provider for automatic update checking on app launch (production only, 5-second delay)
- `UpdaterService` singleton in main process managing update lifecycle: check, download, install with event forwarding to renderer
- `app-update.yml` generated in packaged app resources directory via Electron Forge `postPackage` hook (platform-aware: macOS app bundle vs Windows/Linux resources)
- IPC channels `updater:check`, `updater:download`, `updater:install`, and `updater:get-version` for renderer-to-main communication
- IPC event channels `updater:checking`, `updater:available`, `updater:not-available`, `updater:progress`, `updater:downloaded`, `updater:error` pushed from main to renderer
- `useUpdater` React hook managing update state (status, version info, download progress, errors) with localStorage-persisted version skipping
- `UpdateNotification` modal component with four states: update available (version badges, release notes, Download & Install / Remind Me Later / Skip This Version), downloading (progress bar with speed and transfer stats), downloaded (Restart & Install / Install Later), and error (Retry / Dismiss)
- `electron-squirrel-startup` handler at app entry for Windows Squirrel installer events
- Preload bridge exposing `checkForUpdates`, `downloadUpdate`, `installUpdate`, `getAppVersion`, and `onUpdaterEvent` listener with cleanup function
- TypeScript types for `UpdateCheckResultIPC` and `DownloadProgressIPC` in electron.d.ts
- Version badge in the top-right corner of the Header displaying the current app version (`vX.X.X`) via `useAppVersion` hook
- Issues button in the Header that opens the GitHub repository issues page in the user's default browser
- Core package unit tests: filters (7 test groups), errors (4 tests), storage (12 tests with mocked fs), client (6 tests with mocked fetch)
- Desktop component tests: SearchForm (14 tests), JobCard (19 tests), JobList (12 tests), JobDetail (47 tests), Header (8 tests), Sidebar (9 tests), Settings (17 tests), SavedJobs (5 tests), ResumeBuilder (52 tests), App integration (10 tests), useSettings (6 tests), useAppVersion (2 tests)
- Desktop unit tests: IPC handlers (43 tests with mocked @job-hunt/core, electron, node:fs, gemini-parser, document-generator, and updater), Gemini parser (29 tests with mocked fetch), Document generator (16 tests with mocked pdfmake and fetch)
- Test setup with `@testing-library/jest-dom` matchers and mocked `window.electronAPI`
- Vitest configured per workspace: Node environment for core, jsdom for desktop
- ESLint flat config with `@eslint/js` recommended rules, `typescript-eslint` recommended rules, and `eslint-config-prettier`
- Prettier configuration (single quotes, trailing commas, 100-char print width, LF line endings)
- EditorConfig for consistent indentation (2-space), charset (UTF-8), and trailing whitespace settings
- Husky git hooks: `pre-commit` runs lint-staged, `pre-push` runs the full test suite
- lint-staged configuration applying ESLint fix and Prettier write on staged `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, and `.md` files
- Vitest configured for both packages: Node environment for `@job-hunt/core`, jsdom environment for `@job-hunt/desktop`
- V8 code coverage with 80% threshold enforcement on statements, branches, functions, and lines
- `.env.example` documenting the required `RAPIDAPI_KEY` environment variable
- `.gitignore` covering `node_modules`, build output directories, and `.env`

### Changed

- Refactor `CanvasIcon` to render SVG icons as `KonvaImage` from a data URL, falling back to a `Rect` placeholder if the image fails to load.
- Update icon tests in `CanvasElements.test.tsx` to target the `Rect` placeholder for `CanvasIcon` events.
- Change default size of newly added icons from `ImageTools` from 16x16 to 24x24.
- Update default icon position when adding from `ImageTools`.
- Set default `showGrid` state to `true` in `useCanvasState` hook.
- Modify `LayoutEditor.test.tsx` to reflect grid being enabled by default and update PNG export error handling to display a "Canvas not ready" message.
- Update `PropertiesPanel.test.tsx` to test both rotation slider and text input for changes.
- Update rotation display tests in `LayoutEditor.test.tsx` and `PropertiesPanel.test.tsx` to verify text input for rotation value.
- Update icon creation in `ImageTools` to include `viewBox` and `filled` properties, controlling fill and stroke based on `filled` state.
- Modify `CanvasShape` to render `Line` elements as horizontal lines by default.
- Adjust `ResumeCanvas` container styling and event handling to support canvas panning.
- Update icon definitions in `shared/layout-types.ts` to explicitly mark certain icons as `filled: true`.
- Rewrite `CanvasText` from a single `Text` component to a `Group` containing a transparent hit-area `Rect` and a padded inner `Text`, applying default 20px horizontal / 10px vertical padding for properly sized text boxes.
- Rename "Stroke Color" label to "Border / Outline" in `ColorTools` with added description text explaining it controls border color and thickness of shapes and dividers.
- Inline text editing overlay in `LayoutEditor` now accounts for text element padding offsets when positioning and sizing the textarea.
- All four document generation orchestrators (`generateTailoredResume`, `generateTailoredCV`, `generateTailoredResumeDocx`, `generateTailoredCVDocx`) now accept an optional `ResumeLayout` parameter and apply extracted layout styles (font family, size, color) to generated documents.
- IPC handlers for `document:generate-resume`, `document:generate-cv`, `document:generate-resume-docx`, and `document:generate-cv-docx` now load the latest saved layout via `loadLatestLayout()` and pass it to the generation pipeline.
- `buildResumePdfLayout`, `buildCVPdfLayout`, `buildResumeDocxLayout`, and `buildCVDocxLayout` accept optional `LayoutStyles` parameter to override default font, size, and color settings.
- Arrow key nudge tests updated for grid-aware behavior; `ColorTools` tests updated for "Border / Outline" rename and stroke width slider; `ResumeCanvas` tests updated with `snapToGrid` prop; `CanvasElements` tests updated for Group-based `CanvasText` component.
- Header redesigned: inline nav buttons replaced with hamburger menu button that opens Sidebar
- Navigation moved from Header to Sidebar component with Search, Saved Jobs, Resume Builder, and Settings views
- API key management moved from `.env` file to user-configured key via Settings UI, encrypted with `safeStorage`
- IPC handlers now load API key from `~/.job-hunt/api-key.enc` instead of `process.env.RAPIDAPI_KEY`
- All renderer components updated with Tailwind `dark:` variant classes for dark mode support
- `useSettings` hook manages dark mode preference via localStorage and `<html>` class toggling
- Tailwind config updated with `darkMode: 'class'`
- Migrated from web dashboard (`apps/web`) to Electron desktop application (`apps/desktop`)
- Replaced HTTP API proxy server with Electron IPC for secure main-process API calls
- Restructured `src/` into `main/` and `renderer/` directories with top-level `preload.ts` for Electron architecture
- `useJobSearch` hook now communicates via `window.electronAPI.searchJobs()` IPC instead of `fetch('/api/search')`
- Root `package.json` scripts updated: `dev` runs Electron Forge, `build:desktop` replaces `build:web`
- Deduplication and post-filtering moved from renderer to main process IPC handler
- `.gitignore` updated for Electron build outputs (`out/`, `.vite/`)
- JobDetail "Experience" section renamed to "Requirements" and expanded to include education level and experience-in-place-of-education indicator
- Resume upload split into two-step IPC flow: `resume:pick-file` (dialog + text extraction) and `resume:parse-text` (Gemini AI parsing), replacing single `resume:parse-file` call
- Resume upload parsing: replaced regex-based `resume-parser.ts` with Gemini Flash 2.5 AI (`gemini-parser.ts`) for accurate structured extraction
- `gemini-parser.ts` prompt updated with no-em-dash instruction; `normalizeGeminiOutput()` now strips em/en dashes from all text fields via `stripDashes()`
- `gemini-parser.ts` exports `enforceRateLimit`, `recordCall`, `GEMINI_ENDPOINT`, and `GeminiResponse` for reuse by `document-generator.ts`
- `pdfmake` added to Vite main config externals alongside `pdf-parse` and `mammoth`
- JobDetail footer redesigned: Bookmark + Resume + CV buttons grouped on left, Apply Now on right
- `App.tsx` loads resume data via IPC on mount and view changes, passes `resumeData` prop to `JobDetail`
- Full-screen processing modal with spinner shown during Resume/CV generation in JobDetail (matches Resume Builder upload pattern), displaying "Generating Resume..." or "Generating CV..." with description text
- Upload Resume button text changes to "Parsing with AI..." during the AI parsing step; processing modal shown only after file is selected
- `pdf-parse` and `mammoth` externalized in Vite main config to avoid bundling issues with `pdf-parse` v1 debug code
- Resume Builder: replaced 500ms debounced auto-save with manual Save button and explicit Reset
- `useResume` hook: added `dirty`, `hasSaved`, `save()`, `reset()`, `importResume()` to return value; removed auto-save debounce
- Resume type interfaces (`ResumeData`, `WorkExperience`, `Education`, `Certification`) extracted from `useResume.ts` to `src/shared/resume-types.ts`
- Generated PDF file naming changed from `Resume_Company_Title.pdf` to `FirstName LastName - Position Resume.pdf` (and equivalent for CV)
- AI prompts for Resume/CV generation now instruct the AI to create entirely new tailored bullet points by comparing job requirements against equivalent job functions from past experience, rather than simply rephrasing existing bullet points
- Skills section in generated Resume/CV PDFs now organized into labeled categories (e.g., "Technical Skills", "Tools & Frameworks") instead of a flat comma-separated list
- ESLint config updated to ignore `**/coverage/**` directories
- Electron Forge config expanded with `executableName`, `appCopyright`, `appBundleId`, `win32metadata`, `postPackage` hook for `app-update.yml` generation, `@electron-forge/publisher-github` for draft releases, and `maker-zip` (macOS) / `maker-rpm` (Linux) makers
- Main process entry updated with `electron-squirrel-startup` handler and `UpdaterService` initialization after window creation
- Fixed GitHub repository references in Forge config, publisher, and `UpdaterService` from `job-hunt` to `job-search-tool` to match actual remote origin

### Removed

- CLI application (`apps/cli`) and all associated commands (`search`, `saved`, `profiles`, `quota`)
- HTTP API proxy server (`server.ts`) — replaced by Electron IPC
- `vite.config.ts` — replaced by Electron Forge Vite plugin configs
- `concurrently` and `tsx` dev dependencies (no longer needed)
- `remainingRequests` prop from Header (RapidAPI header tracking replaced by IPC quota)
- `dotenv` dependency and `.env`-based API key loading — replaced by user-configured key via Settings UI
- Inline Search/Saved Jobs navigation buttons from Header (replaced by Sidebar)
- Auto-save with 500ms debounce in `useResume` hook (replaced by manual Save button)
- Regex-based resume parser (`resume-parser.ts`) — replaced by AI-powered Gemini parser
- Professional Summary section from Resume Builder and `summary` field from `ResumeData` type

### Fixed

- CI pipeline: added `build:core` step before typecheck and test jobs so `@job-hunt/core` and `@job-hunt/core/browser` declaration files exist at resolution time
- Electron Forge `package.json` main entry corrected from `.vite/build/main.js` to `.vite/build/index.js` (matches Vite library mode output filename)
- Squirrel for Windows packaging: renamed package from scoped `@job-hunt/desktop` to `job-hunt-desktop` (Squirrel cannot handle `@`/`/` in `.nuspec` paths)
- Added required `author` and `description` fields to desktop `package.json` for Squirrel `.nuspec` generation
- Preload script moved from `src/preload/index.ts` to `src/preload.ts` to avoid filename collision with main process in `.vite/build/`
- Removed `import type` from `@job-hunt/core` in preload script to prevent Vite dev server resolution errors
- Stripped custom `build.lib` overrides from `vite.main.config.ts` and `vite.preload.config.ts`, delegating build configuration to the Forge Vite plugin defaults
- Main process preload path corrected from `../preload/index.js` to `path.join(__dirname, 'preload.js')` matching Forge output structure
- Removed `"type": "module"` from desktop `package.json` to fix CJS/ESM mismatch with Forge plugin's CJS output
- `@job-hunt/core` bundled into main process (no longer externalized) to avoid `require()` of ESM module error
- Core package `exports` field changed from `"import"` to `"default"` condition for broader compatibility
- Renamed `postcss.config.js` to `postcss.config.mjs` to eliminate Node ESM detection warning
- Added `.vite/` to ESLint ignore patterns to prevent linting build artifacts
- Added `typecheck` script (`tsc --noEmit`) to root, core, and desktop `package.json` for monorepo-wide type checking via `npm run typecheck`
- Fixed missing `beforeEach` import from Vitest in desktop test setup
- Fixed `QuotaStatus` type cast in IPC handler rate-limit test
- Fixed `getEducationLevel` in JobDetail crashing when `job_required_education` is undefined (added null guard)
- CI build job: added `-w apps/desktop` workspace flag so platform-specific build scripts (`build:linux`, `build:win`, `build:mac`) resolve to the desktop package
- CI test job: changed `npm test` to `npm run test:coverage` so coverage reports are generated for artifact upload
- Added `test:coverage` script to `@job-hunt/core` and root `package.json` for monorepo-wide coverage via `npm run test:coverage`
- Resolved React `act(...)` test warnings across Header, Settings, App, useAppVersion, and useUpdater tests by flushing async `useEffect` state updates
- Removed `electron-squirrel-startup` and `electron-updater` from Vite externals so they are bundled into the main process instead of failing at runtime in the packaged app
- Linux Forge makers (deb/rpm): added `bin: 'job-hunt'` to match `packagerConfig.executableName`
- RPM maker: added required `license: 'MIT'` field for rpmbuild
- Release workflow: added `build:core` step and `-w apps/desktop` workspace flag to all platform build jobs

## [0.0.4] - 2026-03-03

### Test

- Workflow Test

## [0.0.3] - 2026-03-03

### Test

- Workflow Test

## [0.0.2] - 2026-03-03

### Test

- Workflow Test
