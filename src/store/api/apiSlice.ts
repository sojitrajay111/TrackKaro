import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/index";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://track-karo-backend.vercel.app";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    cache: "no-store",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state?.auth?.accessToken || (typeof window !== "undefined" ? localStorage.getItem("trackkaro_access_token") : null);

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "User",
    "Transactions",
    "Khata",
    "Budgets",
    "Reminders",
    "Groups",
    "Deals",
    "Subscriptions",
    "Notifications",
  ],
  endpoints: () => ({}),
});
