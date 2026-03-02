# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

#### Monorepo Structure

- npm workspaces monorepo with two packages: `@job-hunt/core` and `@job-hunt/desktop`
- Shared TypeScript base config (`tsconfig.base.json`) targeting ES2022 with strict mode enabled
- Root-level build, test, lint, and format scripts that operate across all workspaces

#### Core Library (`@job-hunt/core`)

- JSearch API client with typed request/response interfaces for the RapidAPI JSearch endpoint
- Automatic retry logic with exponential backoff (up to 3 retries) and 429 rate-limit handling
- API quota tracking via `X-RateLimit-Requests-Remaining` response header
- Job detail fetching by job ID (`getJobDetails`)
- Comprehensive TypeScript types for job results, salary data, experience/education requirements, and apply options
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

#### Desktop Application (`@job-hunt/desktop`)

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
- Sidebar navigation with Search, Saved Jobs, and Settings views with quota display
- Settings screen with General (dark mode toggle) and API (RapidAPI key management) categories
- Dark mode with class-based Tailwind CSS toggling, persisted to localStorage via `useSettings` hook
- API key input with validation: key is tested against JSearch API before saving, with success/error feedback
- "How to Get" expandable guide in Settings explaining how to obtain a RapidAPI key
- API key encrypted at rest using Electron `safeStorage` (with plaintext fallback when keyring unavailable), stored at `~/.job-hunt/api-key.enc`
- IPC channels for API key management: `settings:save-api-key`, `settings:get-api-key-status`, `settings:remove-api-key`
- DevTools auto-open in development mode (`!app.isPackaged`)
- Dark mode variants across all renderer components (SearchForm, JobList, JobCard, JobDetail, SavedJobs, Header, Sidebar, Settings)
- Cross-platform packaging via Electron Forge makers (Squirrel for Windows, DMG for macOS, deb for Linux)

#### Test Suite

- Core package unit tests: filters (7 test groups), errors (4 tests), storage (12 tests with mocked fs), client (6 tests with mocked fetch)
- Desktop component tests: SearchForm (8 tests), JobCard (9 tests), JobList (6 tests), Header (4 tests), Sidebar (9 tests), Settings (11 tests), SavedJobs (5 tests), App integration (7 tests)
- Desktop unit tests: IPC handlers (10 tests with mocked @job-hunt/core, electron, and node:fs)
- Test setup with `@testing-library/jest-dom` matchers and mocked `window.electronAPI`
- Vitest configured per workspace: Node environment for core, jsdom for desktop

#### Tooling and Configuration

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

- Header redesigned: inline nav buttons replaced with hamburger menu button that opens Sidebar
- Navigation moved from Header to Sidebar component with Search, Saved Jobs, and Settings views
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

### Removed

- CLI application (`apps/cli`) and all associated commands (`search`, `saved`, `profiles`, `quota`)
- HTTP API proxy server (`server.ts`) — replaced by Electron IPC
- `vite.config.ts` — replaced by Electron Forge Vite plugin configs
- `concurrently` and `tsx` dev dependencies (no longer needed)
- `remainingRequests` prop from Header (RapidAPI header tracking replaced by IPC quota)
- `dotenv` dependency and `.env`-based API key loading — replaced by user-configured key via Settings UI
- Inline Search/Saved Jobs navigation buttons from Header (replaced by Sidebar)

### Fixed

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
