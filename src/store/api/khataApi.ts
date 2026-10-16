import { apiSlice } from "./apiSlice";
import type { KhataEntry } from "@/store/types";

export const khataApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getKhataEntries: builder.query<KhataEntry[], void>({
      query: () => "/khata",
      providesTags: (result) =>
        result
          ? [
              ...result.map((k) => ({ type: "Khata" as const, id: k.id })),
              { type: "Khata" as const, id: "LIST" },
            ]
          : [{ type: "Khata" as const, id: "LIST" }],
    }),

    addKhataEntry: builder.mutation<
      KhataEntry,
      Omit<KhataEntry, "id" | "status"> & { status?: "pending" | "settled" }
    >({
      query: (body) => ({
        url: "/khata",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Khata", id: "LIST" }],
    }),

    toggleKhataStatus: builder.mutation<KhataEntry, string>({
      query: (id) => ({
        url: `/khata/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Khata", id },
        { type: "Khata", id: "LIST" },
      ],
    }),

    deleteKhataEntry: builder.mutation<void, string>({
      query: (id) => ({
        url: `/khata/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Khata", id },
        { type: "Khata", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetKhataEntriesQuery,
  useAddKhataEntryMutation,
  useToggleKhataStatusMutation,
  useDeleteKhataEntryMutation,
} = khataApi;
