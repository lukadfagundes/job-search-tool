# Job Hunt

A personal job search tool that queries real job listings and gives you direct links to apply. Comes with both a CLI and a web dashboard, powered by the JSearch API.

## Features

- **CLI search** -- Run `job-hunt search "react developer" --remote` from your terminal and get a formatted table of results
- **Web dashboard** -- Browse, filter, and bookmark jobs from a local React UI
- **Bookmarks** -- Save interesting jobs for later; view and manage them from either interface
- **Search profiles** -- Save commonly-used search + filter combos as named profiles and re-run them with one command
- **Advanced filters** -- Salary range, keyword include/exclude, company blocklist, direct-apply-only, experience level, date posted
- **Deduplication** -- Automatically removes duplicate listings that appear across multiple job boards
- **Rate limit awareness** -- Displays your remaining API quota after each request

## Tech Stack

| Layer         | Technology                          | Purpose                                         |
| ------------- | ----------------------------------- | ----------------------------------------------- |
| Language      | TypeScript (strict)                 | Shared types across CLI and web                 |
| Monorepo      | npm workspaces                      | Manages `packages/core`, `apps/cli`, `apps/web` |
| API client    | Native `fetch`                      | Zero-dependency HTTP (Node 18+)                 |
| CLI framework | Commander                           | Command parsing and help generation             |
| CLI output    | Chalk + cli-table3                  | Colored, tabular terminal output                |
| Web framework | React 18 + Vite                     | Fast dev server, HMR                            |
| Styling       | Tailwind CSS                        | Utility-first CSS                               |
| Storage (CLI) | JSON file (`~/.job-hunt/data.json`) | Bookmarks, profiles, seen-job tracking          |
| Storage (Web) | localStorage                        | Browser-side bookmark persistence               |
| Linting       | ESLint + Prettier                   | Code quality and formatting                     |
| Testing       | Vitest                              | Unit tests across all packages                  |

## Getting Started

### Prerequisites

- **Node.js 18+** (native `fetch` is required)
- **npm 7+** (for workspace support)
- A **RapidAPI key** for the JSearch API

### Installation

```bash
# Clone the repository
git clone <repo-url> job-hunt
cd job-hunt

# Install all dependencies (root + all workspaces)
npm install

# Copy the example env file and add your API key
cp .env.example .env
```

Open `.env` and paste your RapidAPI key:

```
RAPIDAPI_KEY=your_key_here
```

### How to get a RapidAPI key

1. Go to [https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Sign up for a free RapidAPI account
3. Subscribe to the **JSearch** API (the free tier gives ~500 requests/month)
4. Copy the `X-RapidAPI-Key` value from any code snippet on the page

### Build

```bash
# Build all packages
npm run build
```

## Usage

### CLI

After building, run commands via the root npm script:

```bash
npm run cli -- <command> [options]
```

#### `search` -- Find jobs

```bash
# Basic search
npm run cli -- search "frontend engineer"

# Remote jobs in a specific location
npm run cli -- search "react developer" --remote --location "San Francisco, CA"

# Full-time roles posted this week, with salary and keyword filters
npm run cli -- search "node.js developer" \
  --type fulltime \
  --date week \
  --min-salary 100000 \
  --include "TypeScript,React" \
  --exclude "Senior,Staff"

# Save the search as a reusable profile
npm run cli -- search "backend engineer" --remote --save my-backend-search

# Open the 3rd result's apply link directly in your browser
npm run cli -- search "data analyst" --open 3
```

**Search options:**

| Flag                          | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `-l, --location <loc>`        | Location (e.g. `"New York, NY"`)                                |
| `-r, --remote`                | Remote jobs only                                                |
| `-t, --type <types>`          | Employment type: `fulltime`, `parttime`, `contractor`, `intern` |
| `-d, --date <period>`         | Date posted: `today`, `3days`, `week`, `month`                  |
| `-e, --experience <level>`    | Experience: `none`, `under3`, `over3`, `no_degree`              |
| `--min-salary <n>`            | Minimum salary (client-side filter)                             |
| `--max-salary <n>`            | Maximum salary (client-side filter)                             |
| `--include <keywords>`        | Required keywords in title/description (comma-separated)        |
| `--exclude <keywords>`        | Excluded keywords (comma-separated)                             |
| `--exclude-companies <names>` | Companies to hide (comma-separated)                             |
| `--direct-apply`              | Only show jobs with direct apply links                          |
| `--pages <n>`                 | Number of result pages to fetch (default: 1)                    |
| `--save <name>`               | Save this search as a named profile                             |
| `--open <n>`                  | Immediately open the Nth result's apply link                    |

After results are displayed, an interactive prompt lets you enter a number to open that job's apply link, type `s<n>` to bookmark a job (e.g. `s3`), or `q` to quit.

#### `saved` -- View bookmarked jobs

```bash
npm run cli -- saved
```

Lists all bookmarked jobs in a table. From the interactive prompt, enter a number to open the apply link, `r<n>` to remove a bookmark, or `q` to quit.

```bash
# Remove a specific saved job by ID
npm run cli -- saved --remove <jobId>
```

#### `profiles` -- Manage saved searches

```bash
# List all saved profiles
npm run cli -- profiles list

# Re-run a saved profile
npm run cli -- profiles run my-backend-search

# Delete a profile
npm run cli -- profiles delete my-backend-search
```

### Web Dashboard

Start the development server (launches both the API proxy server and the Vite dev server):

```bash
npm run dev:web
```

The dashboard opens in your browser and provides:

- A search form with all the same filters available in the CLI
- A scrollable list of job cards showing title, company, location, salary, and posting date
- A detail panel with the full job description, required skills, and all available apply links
- Bookmark toggle on each job card
- A "Saved Jobs" view for managing your bookmarks

## Project Structure

```
job-hunt/
├── packages/
│   └── core/                        # Shared library
│       └── src/
│           ├── api/
│           │   ├── client.ts        # JSearch API wrapper with retry + backoff
│           │   └── types.ts         # TypeScript interfaces for API and app
│           ├── filters/
│           │   └── index.ts         # Client-side post-filtering and dedup
│           ├── storage/
│           │   └── index.ts         # JSON file storage for bookmarks + profiles
│           └── index.ts             # Barrel export
├── apps/
│   ├── cli/                         # CLI application
│   │   └── src/
│   │       ├── commands/
│   │       │   ├── search.ts        # job-hunt search
│   │       │   ├── saved.ts         # job-hunt saved
│   │       │   └── profiles.ts      # job-hunt profiles
│   │       └── index.ts             # Entry point (Commander setup)
│   └── web/                         # Web dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── SearchForm.tsx    # Search + filter form
│       │   │   ├── JobCard.tsx       # Single job listing card
│       │   │   ├── JobList.tsx       # Scrollable results list
│       │   │   ├── JobDetail.tsx     # Expanded job view with all apply options
│       │   │   ├── SavedJobs.tsx     # Bookmarked jobs view
│       │   │   └── Header.tsx        # Navigation bar
│       │   ├── hooks/
│       │   │   └── useJobSearch.ts   # React hook wrapping the search logic
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── server.ts               # API proxy server (keeps RapidAPI key server-side)
├── .env.example                    # Environment variable template
├── package.json                    # Workspace root
└── tsconfig.base.json              # Shared TypeScript config
```

## Development

### npm Scripts

| Script                 | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run build`        | Build all workspaces                              |
| `npm run build:core`   | Build only `@job-hunt/core`                       |
| `npm run build:cli`    | Build only `@job-hunt/cli`                        |
| `npm run build:web`    | Build only `@job-hunt/web`                        |
| `npm run dev:web`      | Start web dashboard (API proxy + Vite dev server) |
| `npm run cli -- <cmd>` | Run a CLI command                                 |
| `npm test`             | Run tests across all workspaces                   |
| `npm run lint`         | Lint all files with ESLint                        |
| `npm run lint:fix`     | Lint and auto-fix                                 |
| `npm run format`       | Format all files with Prettier                    |
| `npm run format:check` | Check formatting without writing                  |

### Local Data

The CLI stores bookmarks, search profiles, and seen-job IDs in `~/.job-hunt/data.json`. This file is created automatically on first use. The web dashboard stores bookmarks separately in the browser's `localStorage`.

## License

MIT
