import type { ChatMessage } from '@/store/types';
import { todayKey } from '@/lib/form';
import { apiSlice } from './apiSlice';

export interface ScannedBillResult {
  merchant: string;
  amount: number;
  category: string;
  date: string;
}

export interface BackendSmartParseResult {
  transcript: string;
  amount: number;
  title: string;
  category: string;
  type: 'expense' | 'income' | 'gave' | 'took';
  date: string;
  personName?: string;
  notes?: string;
  savedRecord?: unknown;
}

export const assistantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendAssistantMessage: builder.mutation<ChatMessage, string>({
      // `today` = the browser's date, so "remind me tomorrow…" means the user's tomorrow.
      query: (text) => ({ url: '/assistant/messages', method: 'POST', body: { text, today: todayKey() } }),
      // A "remind me…" message creates a task on the server: refresh task lists too.
      invalidatesTags: (result) =>
        result?.actionType === 'reminder_set' ? ['Assistant', { type: 'Tasks', id: 'LIST' }] : ['Assistant'],
    }),
    scanBill: builder.mutation<ScannedBillResult, { imageBase64?: string; mimeType?: string }>({
      query: (body) => ({ url: '/assistant/scan-bill', method: 'POST', body: body || { imageBase64: 'placeholder' } }),
    }),
    smartParseVoice: builder.mutation<
      BackendSmartParseResult,
      { text: string; mode?: 'expense' | 'khata'; autoSave?: boolean }
    >({
      query: (body) => ({ url: '/assistant/smart-parse', method: 'POST', body }),
      invalidatesTags: (res) => (res?.savedRecord ? [{ type: 'Transactions', id: 'LIST' }, 'Khata', 'Budgets'] : []),
    }),
  }),
});

export const { useSendAssistantMessageMutation, useScanBillMutation, useSmartParseVoiceMutation } = assistantApi;
