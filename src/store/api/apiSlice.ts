import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/index";
import { logOut, setCredentials, type User } from "@/store/slices/authSlice";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://track-karo-backend.vercel.app";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  cache: "no-store",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    return headers;
  },
});

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  user?: User;
}

// One refresh in flight at a time: concurrent 401s all wait on the same promise.
let refreshing: Promise<boolean> | null = null;

/**
 * fetchBaseQuery plus silent token refresh: on a 401, exchange the refresh token for a new
 * pair via POST /auth/refresh and retry the request once. If the refresh fails the session
 * is over, so the user is logged out (AuthGuard then sends them to /auth/login).
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  if (refreshing) await refreshing;
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  const isAuthCall = /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/.test(url);
  if (result.error?.status !== 401 || isAuthCall) return result;

  if (!refreshing) {
    refreshing = (async () => {
      const state = api.getState() as RootState;
      const refreshToken = state.auth.refreshToken;
      const user = state.auth.user;
      if (!refreshToken) return false;
      const res = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST", body: { refreshToken } },
        api,
        extraOptions
      );
      const data = res.data as RefreshResponse | undefined;
      const nextUser = data?.user ?? user;
      if (!data?.accessToken || !nextUser) return false;
      api.dispatch(
        setCredentials({
          user: nextUser,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? refreshToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
        })
      );
      return true;
    })().finally(() => {
      refreshing = null;
    });
  }

  const ok = await refreshing;
  if (ok) {
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    api.dispatch(logOut());
  }
  return result;
};

/**
 * One shared RTK Query cache so a mutation in one domain can invalidate related domains.
 * Each domain injects its endpoints from its own file via `apiSlice.injectEndpoints`.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Transactions",
    "Khata",
    "Budgets",
    "Reminders",
    "Groups",
    "Deals",
    "Tasks",
    "Subscriptions",
    "Notifications",
    "Assistant",
    "Savings",
  ],
  endpoints: () => ({}),
});
