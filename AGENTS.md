<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TrackKaro Website — Agent Guidelines

Guidance for AI agents and developers working on the `trackkaro-website` repository.

---

## 1. Quick Reference & Commands

```bash
# Start Next.js development server (Turbopack)
npm run dev

# Run TypeScript compiler check (Zero errors strictly required)
npx tsc --noEmit

# Run ESLint
npm run lint

# Create production build
npm run build

# Start production server
npm run start
```

> **Critical constraint:** Always verify static type safety with `npx tsc --noEmit` before concluding any edit or task.

---

## 2. Architecture Overview

`trackkaro-website` is a **Next.js 16 (App Router)** web application with **React 19**, **Tailwind CSS v4**, and **Redux Toolkit (RTK Query)**. It acts as the public web companion to the TrackKaro mobile app (`../TrackKaro`), serving:
1. **Public Marketing Site**: Landing page, product tours, feature comparisons, FAQs, and legal pages (`/`, `/terms`, `/privacy`).
2. **Authenticated Web Dashboard**: Complete web management interface for personal finances, budgeting, debt ledgers, split groups, recurring bills, subscriptions, tasks, calendar agenda, deal discovery, and an AI financial assistant (`/dashboard/*`).

Both the website and the mobile app connect to the same **NestJS + MongoDB** backend API (`../TrackKaro-backend`). All core domain data is persisted on the backend and fetched/mutated via RTK Query.

### 2.1 Project Layout

```
src/
├── app/                      # Next.js App Router
│   ├── auth/                 # Split-screen Auth (login, signup, forgot password)
│   ├── dashboard/            # Authenticated web dashboard
│   │   ├── assistant/        # AI Financial Assistant & Voice chat
│   │   ├── calendar/         # Month grid, day agendas, hover previews
│   │   ├── deals/            # Live Deals & Offers with affiliate tracking
│   │   ├── expenses/         # Transactions & Category Budgets
│   │   ├── groups/           # Split Groups & debt simplification
│   │   ├── khata/            # P2P Credit/Debit Ledger & WhatsApp statements
│   │   ├── reminders/        # Recurring Bills & late fee alerts
│   │   ├── settings/         # Profile, appearance, notifications, export & GDPR
│   │   ├── spending/         # Spending analytics & Category limits
│   │   ├── subscriptions/    # Recurring subscriptions & overlap detection
│   │   └── tasks/            # Planner tasks, due dates, times & priorities
│   ├── privacy/              # Privacy Policy
│   ├── terms/                # Terms of Service
│   ├── globals.css           # Tailwind v4 theme tokens, color scales & typography
│   ├── layout.tsx            # Root layout with ThemeProvider & ReduxProvider
│   └── page.tsx              # Public Landing Page
├── components/
│   ├── dashboard/            # Sidebar, Header, Global "+ New" modal, Search
│   ├── expenses/             # Transaction forms, category pickers, filters
│   ├── groups/               # Group cards, member standings, split logic
│   ├── khata/                # Customer drawer, settle modal, statement generator
│   ├── marketing/            # Landing page hero, feature cards, FAQ, testimonials
│   ├── planner/              # Task forms, reminder forms, subscription forms
│   ├── ui/                   # Skeletons, modals, segmented controls, inputs
│   └── theme-provider.tsx    # Next-themes wrapper (system/light/dark)
├── lib/                      # Pure utilities (money, date, form, offline sync, api)
└── store/                    # Redux store & RTK Query slices
    ├── api/                  # Injected API endpoints per domain
    └── slices/               # UI-only slices (auth, offline queue, settings)
```

---

## 3. Data & State Management

### 3.1 RTK Query Architecture (`src/store/api/`)
- A single `apiSlice` (`src/store/api/apiSlice.ts`) defines shared caching, tags, and base queries against `NEXT_PUBLIC_API_URL`.
- **Domain endpoints** are injected individually:
  - `transactionsApi.ts` — Transactions CRUD, bill scans, AI text parsing
  - `budgetsApi.ts` — Monthly category spending limits and threshold alerts
  - `khataApi.ts` — Peer-to-peer customer accounts, entries, settlements, PDF/WhatsApp statements
  - `groupsApi.ts` — Split groups, 4 split strategies (equal, exact, percent, shares), debt simplification
  - `remindersApi.ts` — Bill reminders with auto-roll forward on payment and undo
  - `subscriptionsApi.ts` — Recurring subscriptions and overlap/duplicate alerts
  - `tasksApi.ts` — Planner tasks with `dueDate`, `dueTime`, `priority`, and status
  - `dealsApi.ts` — Live product discovery, wishlist, search paging
  - `assistantApi.ts` — AI financial recommendations and natural-language prompt handling
  - `authApi.ts` — Sessions, login, signup, token refreshes, GDPR account deletion
  - `notificationsApi.ts` — In-app alerts and notifications
- **Cross-domain cache invalidation:** A mutation in one domain invalidates related tags across domains (e.g. confirming a group expense invalidates `Groups`, `Transactions`, and `Budgets`).

### 3.2 Offline Sync Support (`src/lib/offline/`)
- When offline, web mutations for **transactions**, **khata entries**, and **group expenses** are queued in local browser storage.
- When connection resumes, pending items are dispatched sequentially and the cache is updated. A non-intrusive status banner notifies the user of sync status.

---

## 4. House Rules & Coding Standards

### 4.1 Strict Type Safety
- TypeScript strict mode is enabled. No `any` type escapes unless interfacing with untyped 3rd-party browser APIs.
- Run `npx tsc --noEmit` on every change.

### 4.2 Styling & Theming (Tailwind CSS v4)
- **Design Tokens:** Always use semantic CSS variables and Tailwind tokens defined in `globals.css`:
  - Accent / Primary: `var(--primary)` (TrackKaro Emerald), `var(--primary-hover)`
  - Surfaces: `var(--surface)`, `var(--surface-muted)`, `var(--surface-elevated)`
  - Borders: `var(--border)`, `var(--border-subtle)`
  - Text: `var(--foreground)`, `var(--muted)`
  - Status: `var(--good)` (Green), `var(--warning)` (Amber), `var(--bad)` / `var(--rose)` (Red)
- **Theme Transitions:** Dark and Light themes are managed via `next-themes`. Avoid inline hardcoded hex values (`#FFFFFF` or `#000000`).
- Ensure no layout shift or flash of unstyled theme on page load.

### 4.3 UI & UX Standards
- **Loading States:** Never flash an empty state before data arrives. Always display a shaped skeleton component mirroring the layout of the card/table being loaded.
- **Destructive Actions:** Deleting transactions, khata entries, split groups, or tasks must require explicit confirmation.
- **Zero Competitor Mentions:** Never mention external competitor services in user-facing copy, code comments, or documentation. Refer to TrackKaro’s native modules ("Digital Khata Ledger", "Shared Groups Engine", "Expense Tracker").
- **Responsive Web Design:** Every page must work on mobile browsers, tablets, and desktop viewports. Dashboard pages utilize a collapsible sidebar and a responsive top/bottom navigation scheme on mobile viewports.

### 4.4 Task & Planner Consistency
- Planner tasks support:
  - Title & Notes
  - Due Date (`YYYY-MM-DD`)
  - Due Time (`dueTime`, e.g., `"05:00 PM"`, `"14:30"`)
  - Priority (`low`, `medium`, `high`)
  - Status (`todo`, `done`)
- Changes to task models must maintain strict parity between the web dashboard and mobile app (`../TrackKaro`).

---

## 5. Checklist Before Committing

- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] No hardcoded colors or raw hex values violating the theme system.
- [ ] Loading skeletons implemented for all asynchronous views.
- [ ] Responsive behavior verified on mobile, tablet, and desktop breakpoints.
- [ ] Data models and API contracts match `../TrackKaro` and `../TrackKaro-backend`.
