# TrackKaro Web

> **Modern Personal Finance, Digital Khata Ledger, Split Groups & Smart Planning Platform**

TrackKaro Web is the official web application and marketing platform for **TrackKaro**. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Redux Toolkit (RTK Query)**, it delivers a public marketing site alongside an authenticated web dashboard for complete personal finance tracking and planning.

The website shares the same high-performance **NestJS + MongoDB** backend (`../TrackKaro-backend`) and user accounts as the TrackKaro mobile app (`../TrackKaro`), keeping all financial records, ledgers, split groups, reminders, and tasks synchronized in real time.

---

## 🌟 Key Features

### 1. Marketing & Onboarding
- **Modern Landing Page**: Live-styled product previews, interactive feature breakdown, 4-step "How It Works" guide, money management comparisons, and searchable FAQs.
- **Split-Screen Authentication**: Secure login, account registration, and OTP password recovery.
- **Adaptive Theming**: Seamless Light and Dark modes powered by `next-themes` with zero flicker on initial load.

### 2. Comprehensive Financial Dashboard
- **Overview & Cash Bridge**: Interactive visual breakdown of monthly cash flow (money in vs. money out), top spending categories, and a 14-day upcoming commitments timeline.
- **Expense Tracking & AI Entry**: Filter transactions by period, category, and payment method. Add transactions manually, via smart AI natural-language input, voice dictation, or receipt image scans.
- **Category Budgets**: Set and monitor monthly spending caps with dynamic health indicators, 80%/100% threshold alerts, and instant category drill-downs.
- **Digital Khata Ledger**: Peer-to-peer credit/debit tracking ("You Will Get" vs. "You Will Give"), full customer transaction histories, bulk settlements, and instant WhatsApp / printable PDF statement exports.
- **Split Groups Engine**: Shared expense tracking with 4 split strategies (equal, exact, percentage, or share-based), receipt scanning, and automated debt simplification to minimize total settlements.
- **Bill Reminders & Subscriptions**: Track recurring utility bills with automatic roll-forward on payment, late-fee warnings, and smart overlapping subscription alerts.

### 3. Planner, Smart Tasks & Time Scheduling
- **Task Management**: Create, edit, complete, and delete tasks with priority levels (**Low**, **Medium**, **High**) and rich notes.
- **Precise Due Time Selection**: Support for scheduled task times (`dueTime`) across both task creation and editing. Includes instant preset chips (**Morning 09:00 AM**, **Afternoon 02:00 PM**, **Evening 06:00 PM**, **Night 09:00 PM**), custom time picking, and single-tap clear (`✕`).
- **Voice Task Dictation**: Speak natural-language tasks (e.g., *"Remind me tomorrow at 4:55 PM to pay electricity bill"*); title, date, time, and priority are extracted automatically into the planner.
- **Interactive Calendar & Agenda**: Unified month grid showing spending, bills, renewals, and tasks. Day agendas highlight task times with dedicated clock badges (`05:00 PM`).

### 4. AI Financial Assistant & Live Deals
- **Conversational Assistant**: Ask financial questions, check affordability against current balances and category budgets, and create voice-driven reminders.
- **Live Deal Discovery**: Search live products (Amazon integration), filter by discount and price, verify purchases against your real budget, and track deals in your persistent Wishlist.

### 5. Offline Resiliency
- Built-in queueing engine saves offline transactions, khata records, and group expenses in browser storage, synchronizing them automatically upon network reconnection.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Core UI** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables design tokens |
| **State & Data Fetching** | [Redux Toolkit](https://redux-toolkit.js.org/) + [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) (Light / Dark / System) |
| **Icons** | Custom Lucide / Heroicons / SVG icon sets |
| **Backend API** | NestJS + MongoDB REST API (`../TrackKaro-backend`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20 or higher recommended)
- **npm** or **yarn**
- Running instance of the TrackKaro backend (`../TrackKaro-backend`)

### 1. Installation

```bash
# Clone and navigate to the website repository
cd trackkaro-website

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Support contact email
NEXT_PUBLIC_SUPPORT_EMAIL=support@trackkaro.com
```

### 3. Development Server

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Quality & Build Commands

```bash
# Type check (must have 0 errors)
npx tsc --noEmit

# Lint code
npm run lint

# Create production build
npm run build

# Run production build locally
npm run start
```

---

## 📁 Repository Structure

```
trackkaro-website/
├── src/
│   ├── app/                      # Next.js App Router (pages & layouts)
│   │   ├── auth/                 # Login, Signup, Forgot Password
│   │   ├── dashboard/            # Signed-in financial dashboard routes
│   │   │   ├── assistant/        # AI Assistant chat & voice tasks
│   │   │   ├── calendar/         # Month grid & Day agenda
│   │   │   ├── deals/            # Live Deals & Wishlist
│   │   │   ├── expenses/         # Transactions & Budgets
│   │   │   ├── groups/           # Split Groups & Settle Up
│   │   │   ├── khata/            # Customer Ledger & Statements
│   │   │   ├── reminders/        # Bill Reminders & Late fee alerts
│   │   │   ├── settings/         # Profile, Theme, Export & Privacy
│   │   │   ├── spending/         # Spending Analytics
│   │   │   ├── subscriptions/    # Recurring Subscriptions
│   │   │   └── tasks/            # Planner Tasks & Time selection
│   │   ├── globals.css           # Tailwind v4 theme tokens & styles
│   │   ├── layout.tsx            # Root layout with providers
│   │   └── page.tsx              # Public Landing Page
│   ├── components/               # Modular domain & UI components
│   │   ├── dashboard/            # Shell, Navigation, Search, Header
│   │   ├── expenses/             # Transaction forms & category pickers
│   │   ├── groups/               # Group cards & split modals
│   │   ├── khata/                # Ledger drawers & settlement tools
│   │   ├── marketing/            # Landing page sections & FAQ
│   │   ├── planner/              # Task, reminder & subscription forms
│   │   └── ui/                   # Skeletons, modals, segmented inputs
│   ├── lib/                      # Utilities (money, date, validation, offline)
│   └── store/                    # Redux store & RTK Query endpoint slices
├── AGENTS.md                     # Agent development rules and architecture notes
├── FEATURES_AND_CAPABILITIES.md  # Detailed feature inventory & capabilities
└── README.md                     # Project documentation
```

---

## 🔗 Related Documentation

- [`FEATURES_AND_CAPABILITIES.md`](./FEATURES_AND_CAPABILITIES.md) — Comprehensive inventory of website capabilities and comparison with the mobile app.
- [`AGENTS.md`](./AGENTS.md) — Architectural rules, coding standards, and checklist for AI agents and developers.
- [`../APP_VS_WEBSITE_GAPS.md`](../APP_VS_WEBSITE_GAPS.md) — Feature parity tracking between TrackKaro Web and the Expo Mobile App.
- [`../TrackKaro/`](../TrackKaro/) — TrackKaro mobile client (Expo SDK 58 / React Native).
- [`../TrackKaro-backend/`](../TrackKaro-backend/) — NestJS + MongoDB backend service.
