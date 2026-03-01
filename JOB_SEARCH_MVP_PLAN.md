# Job Hunt MVP — Build Plan

A TypeScript CLI + local web UI that queries the JSearch API to find job listings matching your criteria, then gives you direct links to apply.

---

## 1. What We're Building

A personal job search tool with two interfaces:

1. **CLI** — Run a command like `job-hunt search "frontend engineer" --remote --location "San Francisco"` and get a filtered table of results with apply links.
2. **Local Web UI** — A simple React (Vite) dashboard where you can set filters, browse results, bookmark jobs, and click through to apply.

Both interfaces share the same core TypeScript library that wraps the JSearch API.

---

## 2. JSearch API Overview

**Provider:** OpenWeb Ninja via RapidAPI
**Base URL:** `https://jsearch.p.rapidapi.com`
**Auth:** RapidAPI key passed as `X-RapidAPI-Key` header

### Key Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /search` | Search jobs by query, location, filters. Returns paginated list. |
| `GET /job-details` | Get full details for a specific job by `job_id`. |
| `GET /search-filters` | Get available filter values (categories, types) for a query. |
| `GET /estimated-salary` | Get salary estimates for a job title + location. |

### `/search` Parameters

| Param | Type | Description |
|---|---|---|
| `query` | string (required) | Job title + optional location, e.g. `"node.js developer in new york"` |
| `page` | int | Page number (starts at 1) |
| `num_pages` | int | Number of pages to return (1-20) |
| `date_posted` | string | `all`, `today`, `3days`, `week`, `month` |
| `remote_jobs_only` | boolean | Filter to remote jobs only |
| `employment_types` | string | Comma-separated: `FULLTIME`, `PARTTIME`, `CONTRACTOR`, `INTERN` |
| `job_requirements` | string | `under_3_years_experience`, `more_than_3_years_experience`, `no_experience`, `no_degree` |
| `radius` | int | Distance in km from location |
| `exclude_job_publishers` | string | Comma-separated publishers to exclude (e.g. `"BeeBe,Dice"`) |
| `categories` | string | Filter by job category |

### Response Shape (per job in `data[]`)

```jsonc
{
  "job_id": "abc123",
  "job_title": "Senior Frontend Engineer",
  "employer_name": "Acme Corp",
  "employer_logo": "https://...",
  "employer_website": "https://acme.com",
  "job_publisher": "LinkedIn",
  "job_employment_type": "FULLTIME",
  "job_apply_link": "https://linkedin.com/jobs/view/...",  // <-- THE GOLDEN FIELD
  "job_apply_is_direct": false,
  "job_description": "We are looking for...",
  "job_is_remote": true,
  "job_city": "San Francisco",
  "job_state": "CA",
  "job_country": "US",
  "job_posted_at_datetime_utc": "2026-02-28T00:00:00.000Z",
  "job_min_salary": 120000,
  "job_max_salary": 180000,
  "job_salary_currency": "USD",
  "job_salary_period": "YEAR",
  "job_benefits": ["dental_coverage", "health_insurance"],
  "job_required_experience": {
    "no_experience_required": false,
    "required_experience_in_months": 36,
    "experience_mentioned": true
  },
  "job_required_skills": ["React", "TypeScript", "Node.js"],
  "job_required_education": { "postgraduate_degree": false, "professional_certification": false },
  "apply_options": [
    { "publisher": "LinkedIn", "apply_link": "https://...", "is_direct": false },
    { "publisher": "Company Site", "apply_link": "https://...", "is_direct": true }
  ]
}
```

### Pricing (RapidAPI Free Tier)

- **Free:** ~500 requests/month (enough for personal use MVP)
- **Pro:** ~$20/mo for 10,000 requests
- Each `/search` call with `num_pages=1` counts as 1 request and returns ~10 jobs

---

## 3. Project Structure

```
job-hunt/
├── packages/
│   └── core/                      # Shared library (API client + types + filtering)
│       ├── src/
│       │   ├── api/
│       │   │   ├── client.ts       # Axios/fetch wrapper for JSearch API
│       │   │   └── types.ts        # TypeScript interfaces for API request/response
│       │   ├── filters/
│       │   │   └── index.ts        # Client-side post-filtering logic (salary, keywords, etc.)
│       │   ├── storage/
│       │   │   └── index.ts        # JSON file-based storage for bookmarks + search profiles
│       │   └── index.ts            # Public API barrel export
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── cli/                        # CLI application
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── search.ts       # `job-hunt search` command
│   │   │   │   ├── saved.ts        # `job-hunt saved` — view bookmarked jobs
│   │   │   │   └── profiles.ts     # `job-hunt profiles` — manage saved search presets
│   │   │   └── index.ts            # CLI entry point (commander/yargs)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                        # Web dashboard (Vite + React)
│       ├── src/
│       │   ├── components/
│       │   │   ├── SearchForm.tsx    # Filter form (query, location, remote, type, etc.)
│       │   │   ├── JobCard.tsx       # Single job listing card with apply link
│       │   │   ├── JobList.tsx       # Scrollable list of job cards
│       │   │   ├── JobDetail.tsx     # Expanded view of a single job
│       │   │   ├── SavedJobs.tsx     # Bookmarked jobs view
│       │   │   └── Header.tsx        # Nav / branding
│       │   ├── hooks/
│       │   │   └── useJobSearch.ts   # React hook wrapping core search logic
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── .env                            # RAPIDAPI_KEY goes here
├── package.json                    # Workspace root (npm workspaces or turborepo)
├── tsconfig.base.json
└── README.md
```

---

## 4. Implementation Plan (Ordered)

### Phase 1: Core Library

**Goal:** Working API client with strong types that both CLI and web can import.

1. **Initialize monorepo** — Set up `npm workspaces` in root `package.json`. Create `packages/core`, `apps/cli`, `apps/web`.
2. **Define TypeScript types** (`packages/core/src/api/types.ts`):
   - `SearchParams` — maps to JSearch `/search` query params
   - `JobResult` — full typed interface for a single job from the `data[]` array
   - `SearchResponse` — the top-level `{ status, request_id, parameters, data }` wrapper
   - `JobDetails` — for the `/job-details` endpoint response
3. **Build API client** (`packages/core/src/api/client.ts`):
   - Class `JSearchClient` that takes a RapidAPI key
   - Methods: `search(params: SearchParams): Promise<SearchResponse>`, `getJobDetails(jobId: string): Promise<JobDetails>`
   - Uses `fetch` (no axios dependency needed — Node 18+ has native fetch)
   - Handles rate limit errors (HTTP 429) with a simple retry + backoff
   - Logs remaining request quota from response headers
4. **Build post-filters** (`packages/core/src/filters/index.ts`):
   - The API filters are good but limited. Add client-side post-filtering:
     - `filterBySalaryRange(jobs, min, max)` — filter out jobs below/above salary thresholds
     - `filterByKeywords(jobs, include[], exclude[])` — scan `job_description` for must-have or must-not-have keywords (e.g. include "React", exclude "Senior" or "10+ years")
     - `filterByCompany(jobs, exclude[])` — blacklist companies you don't want to see
     - `filterByDirectApply(jobs)` — only show jobs where `job_apply_is_direct === true`
5. **Build storage layer** (`packages/core/src/storage/index.ts`):
   - Read/write a local `~/.job-hunt/data.json` file
   - Store: bookmarked jobs, search profiles (saved filter presets), seen job IDs (dedup)
   - Simple functions: `saveJob(job)`, `getSavedJobs()`, `removeSavedJob(id)`, `saveProfile(name, params)`, `getProfiles()`

### Phase 2: CLI App

**Goal:** Usable from the terminal. Search, filter, see results, open apply links.

6. **Set up CLI framework** — Use `commander` for commands + `chalk` for colored output + `cli-table3` for tabular display.
7. **`search` command:**
   ```
   job-hunt search <query> [options]

   Options:
     -l, --location <loc>       Location (e.g. "San Francisco, CA")
     -r, --remote               Remote jobs only
     -t, --type <types>         Employment type: fulltime,parttime,contractor,intern
     -d, --date <period>        Date posted: today, 3days, week, month
     -e, --experience <level>   Experience: none, under3, over3
     --min-salary <n>           Minimum salary (client-side filter)
     --max-salary <n>           Maximum salary (client-side filter)
     --include <keywords>       Required keywords in description (comma-separated)
     --exclude <keywords>       Excluded keywords in description (comma-separated)
     --exclude-companies <names> Companies to hide (comma-separated)
     --direct-apply             Only show direct-apply jobs
     --pages <n>                Number of pages to fetch (default: 1)
     --save <name>              Save this search as a named profile
     --open <n>                 Immediately open the Nth result's apply link in browser
   ```
   - Display results as a numbered table: `# | Title | Company | Location | Remote | Salary | Posted | Source`
   - After displaying, prompt: "Enter a number to open apply link, 's' to save a job, or 'q' to quit"
   - Use `open` package to launch the `job_apply_link` in the default browser
8. **`saved` command:** — List bookmarked jobs, option to open their apply links or remove them.
9. **`profiles` command:** — List saved search profiles, run one by name (`job-hunt profiles run my-search`).

### Phase 3: Web Dashboard

**Goal:** A nicer visual interface for browsing and filtering jobs.

10. **Scaffold Vite + React + TypeScript app** in `apps/web`.
11. **Proxy setup** — Vite dev server proxies `/api/*` to a tiny Express server (or just call RapidAPI directly from the client for the MVP — the key is exposed but it's a personal tool). If you want to keep the key server-side, add a minimal Express API in `apps/web/server.ts` that proxies requests.
12. **SearchForm component:**
    - Text inputs: query, location
    - Toggles/checkboxes: remote only, direct apply only
    - Dropdowns: employment type, date posted, experience level
    - Number inputs: min/max salary
    - Text input: include/exclude keywords
    - "Search" button + "Save as Profile" button
13. **JobList + JobCard components:**
    - Card shows: job title, company (with logo if available), location, remote badge, salary range, posted date, source publisher
    - Primary CTA button: **"Apply →"** which opens `job_apply_link` in new tab
    - Secondary actions: bookmark, show details
14. **JobDetail component:**
    - Full job description (rendered from text/HTML)
    - Required skills, experience, education
    - All available apply options (from `apply_options[]`) so user can pick their preferred source
    - Bookmark toggle
15. **SavedJobs view:**
    - List of bookmarked jobs with apply links
    - Ability to remove bookmarks
    - Stored in `localStorage` for the web app (or the shared JSON file if using the Express proxy)

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety, shared types across CLI + web |
| Monorepo | npm workspaces | Simple, no extra tooling needed |
| API calls | Native `fetch` | Zero dependencies, Node 18+ |
| CLI framework | `commander` | Lightweight, good DX |
| CLI output | `chalk` + `cli-table3` | Colored, readable terminal output |
| Browser open | `open` (npm package) | Cross-platform `open URL in browser` |
| Web framework | React 18 + Vite | Fast dev server, minimal config |
| Styling | Tailwind CSS | Rapid prototyping, utility classes |
| Storage (CLI) | JSON file (`~/.job-hunt/data.json`) | No database needed for personal tool |
| Storage (Web) | `localStorage` | Simplest option for bookmarks in browser |

---

## 6. Environment Setup

```bash
# .env (root)
RAPIDAPI_KEY=your_key_here
```

To get a key:
1. Go to https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Sign up (free)
3. Subscribe to the free tier
4. Copy your `X-RapidAPI-Key` from the code snippets

---

## 7. Key Design Decisions

- **Client-side post-filtering** is essential because the JSearch API doesn't support salary range filtering or keyword inclusion/exclusion natively. We fetch a broad set and narrow it down locally.
- **`apply_options[]`** is important — a single job often has multiple apply links from different publishers. The web UI should surface all of them so the user can pick the most direct one.
- **Deduplication** — JSearch can return the same job from multiple publishers. Deduplicate by normalizing `job_title + employer_name + job_city` or by tracking seen `job_id`s.
- **Rate limit awareness** — The free tier is ~500 req/month. The CLI should show remaining quota. The web UI should cache results and warn before making requests.

---

## 8. Stretch Goals (Post-MVP)

- **Email/notification digest** — Scheduled cron that runs saved profiles and emails new results
- **AI matching** — Send job description to an LLM to score how well it matches your resume
- **Application tracker** — Track which jobs you've applied to, interview status, follow-up dates
- **Resume tailoring** — Generate a tailored resume summary per job description using an LLM
- **Browser extension** — One-click bookmark from Indeed/LinkedIn pages back into your tool
