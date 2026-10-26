# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Verified details (where this differs from AGENTS.md, trust this section)

- **No test suite.** There is no test runner configured; verification is `npx tsc --noEmit` plus `npm run lint` (ESLint 9 flat config, `eslint.config.mjs`).
- **Theming is a custom provider, not `next-themes`.** `src/components/theme-provider.tsx` stores the choice in a `theme` cookie; `src/app/layout.tsx` reads that cookie server-side and sets `data-theme` on `<html>` so the first paint is correct without an inline script. `"system"` leaves `data-theme` unset and CSS follows the device.
- **Provider order** in the root layout: `ThemeProvider` → `StoreProvider` (`src/store/provider.tsx`, one store per client via `makeStore`) → `I18nProvider` (`src/i18n/`, languages `en`/`hi`/`gu`, persisted in localStorage key `trackkaro_lang`; strings live in `src/i18n/translations.ts`).
- **Redux store** has only two reducers: `auth` (`src/store/slices/authSlice.ts`, session restored from localStorage keys `trackkaro_user`, `trackkaro_access_token`, `trackkaro_refresh_token`, `trackkaro_token_expires`) and the RTK Query `api` slice. Shared domain types are in `src/store/types.ts`. There is also a `savingsApi.ts` domain (tag `Savings`).

### Request pipeline (`src/store/api/apiSlice.ts`)
The base query is layered, outermost first:
1. `baseQueryWithOffline` — when `navigator.onLine` is false and the URL/method matches the `QUEUEABLE` regex list in `src/lib/offline-queue.ts`, the write is stored in localStorage (`tk.offline-queue`) and a fake success is returned. Records created offline get ids prefixed `offline-` and later queued writes referencing them are re-pointed on sync. `src/components/dashboard/offline-sync.tsx` (mounted in the dashboard layout) replays the queue when back online.
2. `baseQueryWithReauth` — on a 401 (except `/auth/*` calls) it does a single shared `POST /auth/refresh`, retries once, and dispatches `logOut()` if refresh fails; `AuthGuard` then redirects to `/auth/login`.
3. `fetchBaseQuery` against `NEXT_PUBLIC_API_URL` (falls back to the hosted backend if unset), with caching disabled.

New domains: add a file under `src/store/api/` using `apiSlice.injectEndpoints`, and register any new tag in `tagTypes`.

### Cross-repo parity
- The offline `QUEUEABLE` list must stay identical to the mobile app's `TrackKaro/src/store/offline/offline-write-support.ts`.
- Task time handling lives in `src/lib/task-time.ts`; keep `dueTime` formats compatible with the mobile app.

### Dashboard shell
`src/app/dashboard/layout.tsx` wraps every dashboard page in `AuthGuard` and mounts the sidebar, header, `WelcomeTour`, `OfflineSync`, and `DesktopNotifications`. Only `<main>` scrolls; sidebar and header stay fixed.
