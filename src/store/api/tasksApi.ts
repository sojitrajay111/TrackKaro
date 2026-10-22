import type { PlannerTask } from '@/store/types';
import { apiSlice } from './apiSlice';

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query<PlannerTask[], { from: string; to: string }>({
      query: ({ from, to }) => `/tasks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Tasks' as const, id: t.id })),
              { type: 'Tasks' as const, id: 'LIST' },
            ]
          : [{ type: 'Tasks' as const, id: 'LIST' }],
    }),

    addTask: builder.mutation<PlannerTask, Omit<PlannerTask, 'id' | 'status'>>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),

    updateTask: builder.mutation<PlannerTask, { id: string; patch: Partial<PlannerTask> }>({
      query: ({ id, patch }) => ({ url: `/tasks/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),

    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
