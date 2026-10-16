import { apiSlice } from "./apiSlice";
import type { ExpenseGroup } from "@/store/types";

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<ExpenseGroup[], void>({
      query: () => "/groups",
      providesTags: (result) =>
        result
          ? [
              ...result.map((g) => ({ type: "Groups" as const, id: g.id })),
              { type: "Groups" as const, id: "LIST" },
            ]
          : [{ type: "Groups" as const, id: "LIST" }],
    }),

    createGroup: builder.mutation<
      ExpenseGroup,
      { name: string; category: ExpenseGroup["category"]; members?: { name: string; phone?: string }[] }
    >({
      query: (body) => ({
        url: "/groups",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Groups", id: "LIST" }],
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Groups", id },
        { type: "Groups", id: "LIST" },
      ],
    }),

    joinGroup: builder.mutation<ExpenseGroup, { inviteCode: string }>({
      query: (body) => ({
        url: "/groups/join",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Groups", id: "LIST" }],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
} = groupsApi;
