import { apiSlice } from "./apiSlice";
import type { Deal } from "@/store/types";

export const dealsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query<Deal[], void>({
      query: () => "/deals",
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: "Deals" as const, id: d.id })),
              { type: "Deals" as const, id: "LIST" },
            ]
          : [{ type: "Deals" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetDealsQuery } = dealsApi;
