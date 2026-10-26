# TrackKaro Website: Features & Capabilities

Everything you can do on the **TrackKaro website**: the public marketing site and the signed-in web dashboard (`/dashboard`). The mobile app has its own list in [`../TrackKaro/FEATURES_AND_CAPABILITIES.md`](../TrackKaro/FEATURES_AND_CAPABILITIES.md), and the differences between the two are tracked in [`../APP_VS_WEBSITE_GAPS.md`](../APP_VS_WEBSITE_GAPS.md).

**Last checked against the code:** 26 Oct 2026. The website and the app use the same backend and account, so a change made in one shows up in the other.

## ✨ New: voice reminders & smart task time

- **Voice task parsing:** Type or say *"remind me tomorrow at 4:55 PM to pay the pizza bill"* in the AI Assistant, or dictate a task using the microphone in the mobile app's Task sheet. TrackKaro parses the task title, date, time, and priority automatically (AI-driven with fallback rules), scheduling it directly into Tasks and the Calendar.
- **Precise time selection & presets:** Tasks support full due time (`dueTime`) selection across both creation and editing. Includes instant preset shortcuts (**Morning 09:00 AM**, **Afternoon 02:00 PM**, **Evening 06:00 PM**, **Night 09:00 PM**), custom time picking, and 1-tap time clearing.
- **Calendar & Agenda time badges:** Scheduled tasks render with an emerald clock badge and formatted time (`05:00 PM`) in day agendas and overview lists.

---

## Quick navigation

1. [Marketing site](#1-marketing-site)
2. [Sign in and sign up](#2-sign-in-and-sign-up)
3. [Dashboard basics](#3-dashboard-basics)
4. [Overview](#4-overview)
5. [Expenses](#5-expenses)
6. [Budgets and spending analysis](#6-budgets-and-spending-analysis)
7. [Khata Ledger](#7-khata-ledger)
8. [Split Groups](#8-split-groups)
9. [Bills](#9-bills)
10. [Subscriptions](#10-subscriptions)
11. [Tasks](#11-tasks)
12. [Calendar](#12-calendar)
13. [Live Deals](#13-live-deals)
14. [AI Assistant](#14-ai-assistant)
15. [Notifications](#15-notifications)
16. [Settings, privacy and your data](#16-settings-privacy-and-your-data)
17. [Offline use](#17-offline-use)
18. [Browser limits](#18-browser-limits)

---

## 1. Marketing site

`/`, `/terms`, `/privacy`

- **Landing page** in the TrackKaro emerald theme: a hero with a live-looking product preview, a features grid, **How it works** in four steps, a comparison with other kinds of money apps, an **FAQ**, and a download banner.
- **Illustrations** throughout, with light animation on scroll.
- **Terms** and **Privacy** pages.
- **Light and dark themes,** following the device by default. The theme is applied before the page appears, so there's no flash.
- The support email comes from `NEXT_PUBLIC_SUPPORT_EMAIL`, or `support@trackkaro.com` if that isn't set.

## 2. Sign in and sign up

`/auth/login`, `/auth/signup`, `/auth/forgot-password`

- **Split screen:** a TrackKaro brand panel on large screens, and the form on its own on phones and tablets.
- No site header or footer, just the logo, a **Home** link and a theme switch.
- **Forgot password** with an email code.

## 3. Dashboard basics

- **Sidebar** in two groups:
  - **Money:** Overview, Expenses, Khata Ledger, Split Groups, Budgets, Live Deals.
  - **Studio:** Bills, Subscriptions, AI Assistant, Tasks, Calendar.
  - Settings sits at the bottom. The sidebar collapses, and phones get a mobile menu instead.
- **"+ New" menu** with keyboard shortcuts:
  - **E** expense, **I** money in;
  - **B** bill, **S** subscription, **T** task;
  - **K** khata entry, **G** new shared group.
- **⌘K / Ctrl+K search** across pages and your records.
- **Welcome tour** for new accounts, which you can replay from Settings.
- **Illustrations** in every empty state and in the tour. They use male or female characters to match the gender set in your profile.
- **Loading skeletons** shaped like the real content, so pages never flash empty.

## 4. Overview

`/dashboard`

- **This month:** where your spending went, by category, in a chart that fits any screen size.
- **Cash bridge:** money in versus money out for the month.
- **Next two weeks:** bills, renewals, tasks and khata dues together, 4 at a time, with **+N more in calendar**.
- **Khata Ledger** card: what you'll get and what you'll give.
- **Budgets:** each row opens Expenses filtered to that category.
- **Deals & Offers:** live deals by category (Electronics by default), with photos, top 3 shown.

## 5. Expenses

`/dashboard/expenses`

- **Two tabs:** Transactions and Budgets. The Budgets tab shows a badge when any category is over its limit.
- **Transactions:** search, and filter by category, period and payment method.
- **Add a transaction:**
  - expense or money in;
  - a large amount box;
  - category and payment chips;
  - date, scope and notes.
- **AI entry:** describe it in a sentence, or speak it, and the form fills in.
- **Scan a bill:** reads the merchant, total and date from a photo and prefills the form.
- **Edit** a transaction from its detail panel.
- **Delete** with a confirmation that previews the transaction first.
- **Category filter from a link:** `?category=Food` opens the list already filtered. Budget rows elsewhere use this.
- **Export CSV** of the transactions currently shown, for the selected period or all time.
- **Every transaction is included:** the list loads all of them, not just the newest 200.

## 6. Budgets and spending analysis

`/dashboard/spending` (called **Budgets** in the sidebar)

- **Daily spending** chart, compared with the previous period.
- **By category:** where the money went.
- **Budgets for the month:**
  - Each category's limit, what's spent and its health colour.
  - **−/+** buttons change the limit quickly, and **Edit** sets an exact amount.
  - **Tap a budget** to see that category's payments.
- **Khata summary:** money lent and borrowed, plus the **oldest dues owed to you**.

## 7. Khata Ledger

`/dashboard/khata`

- **You will get** and **You will give** totals.
- **People list**, most recent first, with search.
- **Ledger drawer** for each person:
  - their full history;
  - settle or unsettle single entries, or **settle everything**;
  - **edit** or delete an entry;
  - **call** them, or send a **WhatsApp reminder**;
  - **statement:** copy it, share it on WhatsApp, or save it as a PDF.
- **Add entries** with a settlement date and notes. **Import a contact** works where the browser supports it (see [Browser limits](#18-browser-limits)).

## 8. Split Groups

`/dashboard/groups`, `/dashboard/groups/[id]`, `/dashboard/groups/confirmations`

- **Create, join (with an invite code), edit and delete** groups.
- **Group page:**
  - **Spent together,** **your share** and **your balance**.
  - **Add, edit and delete expenses:**
    - split them **equally**, by **exact amounts**, by **percentages** or by **shares**;
    - or **scan a bill** to fill one in.
  - **Member standings:** who is owed and who owes.
  - **Suggested payments,** with a **Simplify debts** switch that only the owner can change:
    - On (the default) shows the fewest payments.
    - Off shows what each pair of people owes each other.
  - **Settle up** between members.
  - **Activity:** every expense and settlement, newest first, with search.
  - **Invite code** to share.
- **Confirm group expenses:** add your share of each group expense to your own spending, in the category you choose. Adding and removing are animated.

## 9. Bills

`/dashboard/reminders`

- **Coming up** list with stat tiles, and a reminder to pay soon when late fees are close.
- **Add, edit and delete** bills: title, amount, category, due date, repeat and notes.
- **Repeats:** one-time, monthly, quarterly or yearly.
- **Paying a recurring bill moves it to the next due date** and keeps the payment history. Use **Undo payment** to reverse one.
- **Mark paid** with a single click. Bills can also be marked paid from the calendar.

## 10. Subscriptions

`/dashboard/subscriptions`

- **Upcoming renewals,** soonest first, with monthly and yearly totals.
- **Overlap alert:** subscriptions the backend flags as duplicate or unused get a banner with the reason, a **Review** tag, and a **Could save / yr** total.
- **Add, edit and delete** subscriptions (monthly or yearly).

## 11. Tasks

`/dashboard/tasks`

- **Full task lifecycle:** Add, edit, complete (`todo`/`done`), and delete tasks.
- **Due dates & precise times:** Due date with optional due time (`dueTime`, e.g. `"05:00 PM"`).
- **Time selection & preset chips:**
  - Works across both **creating a new task** and **editing an existing task**.
  - One-tap quick presets: **Morning (09:00 AM)**, **Afternoon (02:00 PM)**, **Evening (06:00 PM)**, **Night (09:00 PM)**.
  - Interactive custom time picker (hours, minutes in 5-min intervals, AM/PM).
  - Single-tap clear (`✕`) to remove time without deleting the task.
- **Voice natural-language parsing:** Dictate task descriptions (e.g. *"Call insurance agent tomorrow at 4 pm"*); title, due date, due time, and priority are extracted automatically.
- **Priorities & notes:** Priority chips (**Low**, **Medium**, **High**) with semantic accent colors, plus optional detailed notes.
- **Smart sorting:** Tasks are sorted chronologically by `${dueDate}${dueTime}`.
- **Overview & Calendar integration:** Open tasks appear in the Overview ("Next two weeks" / "Coming Up") and on the Calendar day agenda with time badges.

## 12. Calendar

`/dashboard/calendar`

- **Month grid** of bills due, renewals, open tasks and spending.
- **Hover previews:** hovering over a day shows what's on it, with a smooth animation.
- **Day agenda with time badges:** View scheduled events for selected dates. Task events prominently show their **scheduled time badge** (`05:00 PM` with clock icon), priority pill, and completion status. Mark bills paid and tick off tasks directly from the agenda.
- **Add to a day:** a payment, bill, renewal or task, with the date filled in.
- Fits any screen size, with nothing spilling out of the day cells.

## 13. Live Deals

`/dashboard/deals`

- **Live search** from the deals provider (currently Amazon), with real product photos, prices, discounts and ratings. No sample or placeholder products are shown.
- **Category chips** and suggestions based on your spending and profile.
- **More deals as you scroll:**
  - The next page loads automatically, up to 10 pages, and is fetched ahead of time to keep scrolling smooth.
  - Later pages keep only products that match the search.
  - A **Load more deals** button and an end-of-results message cover the rest.
- **Skeletons** while a search loads, never stale results from an earlier search.
- **Sort, price range and store filter.**
- **Wishlist** (tap the heart), kept between visits.
- **Deal detail drawer:**
  - a price breakdown;
  - a **"Should you buy this?"** check against your real spending, budget and balance;
  - **price alerts** and **share**;
  - a link to the store's page.
- Store links open the store directly, and the click is recorded. Affiliate links are switched off until the Cuelinks channel is fixed.

## 14. AI Assistant

`/dashboard/assistant`

- **Chat about your money,** with **Try asking** prompts to get started.
- **Creates reminders:** "remind me tomorrow at 4:55 PM to pay the pizza bill" adds the task with its date and time (AI reads it; rules take over if the AI is unavailable). It shows in Tasks and the calendar here, and the phone app rings at that time.
- **Voice questions** through the browser's speech recognition.
- **How it works** panel explaining what the assistant can see and do.

## 15. Notifications

- **Bell popover** in the header: list, mark one or all as read, and clear. It fits on small screens without scrolling sideways.
- **Desktop alerts** while TrackKaro is open in a tab, once you allow notifications in Settings.

## 16. Settings, privacy and your data

`/dashboard/settings`

The settings sections stay in a sticky menu as you scroll:

- **Profile:** name, phone, and gender (Male, Female, Other or Skip). Gender also chooses deal suggestions and male or female illustrations.
- **Appearance:** theme (Light, Dark or Auto) and language (English, हिंदी or ગુજરાતી).
- **Notifications:** saved preferences, plus permission for desktop alerts.
- **Data & privacy:**
  - **PDF report** for a date range;
  - **JSON backup**;
  - **Clear all data,** where you type DELETE to confirm;
  - **log out of all devices**.
- **Replay the welcome tour.**
- **Contact support:** opens an email to support@trackkaro.com (set by `NEXT_PUBLIC_SUPPORT_EMAIL`).
- **About:** version (TrackKaro v1.0.0 · Web Edition), Privacy and Terms.

## 17. Offline use

- While offline, these changes are saved in the browser and sent, in order, when you're back online:
  - new, edited and deleted **transactions**;
  - **khata entries**, including settling;
  - **group expenses and settlements**.
- Transaction edits and deletes show in the list straight away. Something added offline can be edited offline too.
- A banner shows how many changes are waiting and when they've synced.
- Everything else (bills, deals, settings and so on) needs a connection.

## 18. Browser limits

These work differently from the app because of what browsers allow:

| Feature | On the website |
|---|---|
| Push notifications | Only while TrackKaro is open in a tab. Alerts with the tab closed (web push) aren't planned for now. |
| Import a phone contact | Only in browsers with the Contact Picker (Chrome on Android). |
| Voice | Chrome, Edge and Safari. Not Firefox. |

---

## Summary

| Area | What you can do | Where |
|---|---|---|
| Marketing | Landing page, FAQ, Terms, Privacy, light/dark | `/`, `/terms`, `/privacy` |
| Sign in | Split-screen login, sign-up, password reset | `/auth/*` |
| Shell | Sidebar, mobile menu, "+ New" with shortcuts, ⌘K search, tour | Every dashboard page |
| Overview | This month chart, cash bridge, next two weeks, khata, budgets, deals by category | `/dashboard` |
| Expenses | Search/filter, add (manual, AI, voice, scan), edit, delete, `?category=` | `/dashboard/expenses` |
| Budgets | Daily and category charts, limits with −/+, tap to see payments, oldest dues | `/dashboard/spending` |
| Khata | Totals, ledgers, settle all, edit, WhatsApp, call, statements | `/dashboard/khata` |
| Split Groups | 4 split types, bill scan, Simplify debts on/off, settle up, confirmations | `/dashboard/groups` |
| Bills | Repeats, roll forward, undo, mark paid | `/dashboard/reminders` |
| Subscriptions | Renewals and totals | `/dashboard/subscriptions` |
| **Voice reminders (new)** | Voice-to-task parsing in Assistant & Task modal auto-fills title, date, time and priority | `/dashboard/assistant`, `/dashboard/tasks` |
| Tasks | Add/edit with due dates, precise time selection, preset chips, agenda time badges, priorities, notes | `/dashboard/tasks` |
| Calendar | Month grid, hover previews, add to a day, mark paid | `/dashboard/calendar` |
| Deals | Live search, lazy loading with prefetch, filters, wishlist, detail, buy check, alerts | `/dashboard/deals` |
| AI Assistant | Chat, prompts, voice | `/dashboard/assistant` |
| Settings | Profile, theme, language, notifications, PDF report, JSON backup, clear data, log out everywhere | `/dashboard/settings` |
