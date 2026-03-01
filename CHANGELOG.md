# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

#### Monorepo Structure

- npm workspaces monorepo with three packages: `@job-hunt/core`, `@job-hunt/cli`, and `@job-hunt/web`
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

#### CLI Application (`@job-hunt/cli`)

- `job-hunt search <query>` command with options for location, remote-only, employment type, date posted, experience level, page count, and auto-open
- Client-side filter flags: `--min-salary`, `--max-salary`, `--include`, `--exclude`, `--exclude-companies`, `--direct-apply`
- Colorized tabular output (via chalk and cli-table3) showing title, company, location, remote status, salary, post date, and source
- Interactive post-search menu to open apply links or save jobs by number
- `--save <name>` flag to persist the current search as a reusable named profile
- `job-hunt saved` command to list bookmarked jobs with interactive open and remove actions
- `job-hunt profiles list` command to display all saved search profiles
- `job-hunt profiles run <name>` command to re-execute a saved profile and display results
- `job-hunt profiles delete <name>` command to remove a saved profile
- `.env` file support via dotenv for the `RAPIDAPI_KEY` credential
- `job-hunt quota` command displaying weekly/monthly usage, limits, remaining, and reset times
- `RateLimitError`-specific catch blocks in `search` and `profiles run` commands with formatted usage output
- Local quota summary (weekly/monthly remaining) displayed after each successful search

#### Web Dashboard (`@job-hunt/web`)

- React 18 single-page application bootstrapped with Vite and styled with Tailwind CSS
- SearchForm component with fields for query, location, remote-only, direct-apply-only, employment type, date posted, and experience level
- Collapsible advanced filters panel for salary range, include keywords, and exclude keywords
- JobList component for displaying search results
- JobCard component for individual job result presentation
- JobDetail modal/panel for viewing full job descriptions and apply options
- SavedJobs view with bookmark management (add/remove toggle)
- Header component with view switching (search vs. saved) and API quota display
- `useJobSearch` custom hook encapsulating fetch, deduplication, and post-filtering logic
- localStorage persistence for saved/bookmarked jobs on the client side
- API proxy server (`server.ts`) using Node.js `http.createServer` to forward `/api/*` requests to JSearch, keeping the RapidAPI key server-side
- Vite dev server configured to proxy `/api` routes to the backend on port 3001
- `concurrently`-based `dev:all` script to launch both the API proxy and Vite dev server together
- Production build targeting ES2020 with esbuild minification and CSS minification
- Rate limit enforcement in API proxy: `checkRateLimit()` before forwarding, `recordApiRequest()` after success
- `/api/quota` endpoint returning current quota status as JSON
- `X-Local-Weekly-Remaining` and `X-Local-Monthly-Remaining` custom response headers forwarded to the browser
- 429 response with quota JSON when local rate limits are exceeded
- `useJobSearch` hook reads local quota headers and exposes `weeklyRemaining` / `monthlyRemaining` state
- Header component displays "X/50 weekly | X/200 monthly" quota indicator

#### Tooling and Configuration

- ESLint flat config with `@eslint/js` recommended rules, `typescript-eslint` recommended rules, and `eslint-config-prettier`
- Prettier configuration (single quotes, trailing commas, 100-char print width, LF line endings)
- EditorConfig for consistent indentation (2-space), charset (UTF-8), and trailing whitespace settings
- Husky git hooks: `pre-commit` runs lint-staged, `pre-push` runs the full test suite
- lint-staged configuration applying ESLint fix and Prettier write on staged `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, and `.md` files
- Vitest configured for both packages: Node environment for `@job-hunt/core`, jsdom environment for `@job-hunt/web`
- V8 code coverage with 80% threshold enforcement on statements, branches, functions, and lines
- `.env.example` documenting the required `RAPIDAPI_KEY` environment variable
- `.gitignore` covering `node_modules`, build output directories, and `.env`

### Changed

_Nothing yet._

### Fixed

_Nothing yet._
