import { apiSlice } from "./apiSlice";

export type NotificationType = "bill" | "deal" | "price_drop" | "insight" | "activity";

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiNotification[], void>({
      query: () => ({
        url: "/notifications",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: "Notifications" as const, id: n.id })),
              { type: "Notifications" as const, id: "LIST" },
            ]
          : [{ type: "Notifications" as const, id: "LIST" }],
    }),

    markNotificationRead: builder.mutation<ApiNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
      ],
    }),

    clearAllNotifications: builder.mutation<void, void>({
      query: () => ({ url: "/notifications", method: "DELETE" }),
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
} = notificationsApi;
