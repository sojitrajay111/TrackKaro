import { apiSlice } from "./apiSlice";
import { useCallback } from "react";
import { setCredentials, logOut, updateUser, type User } from "../slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other" | "unspecified";
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthTokens, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // handled in component
        }
      },
    }),

    login: builder.mutation<AuthTokens, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // handled in component
        }
      },
    }),

    logout: builder.mutation<{ success: boolean }, { refreshToken: string }>({
      query: (body) => ({
        url: "/auth/logout",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Server revoke failed (offline, already expired) — still log out locally.
        }
        dispatch(logOut());
        dispatch(apiSlice.util.resetApiState());
      },
    }),

    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(updateUser(data));
        } catch {
          // handled in component
        }
      },
    }),

    forgotPassword: builder.mutation<{ success: boolean; message?: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<{ success: boolean; message?: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
} = authApi;

/** Revoke this session on the server, then clear local auth state and cached data. */
export function useSignOut() {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const [logout, { isLoading }] = useLogoutMutation();

  const signOut = useCallback(async () => {
    if (refreshToken) {
      // onQueryStarted clears local state whether or not the server call succeeds.
      await logout({ refreshToken }).unwrap().catch(() => {});
    } else {
      dispatch(logOut());
      dispatch(apiSlice.util.resetApiState());
    }
  }, [dispatch, logout, refreshToken]);

  return { signOut, isSigningOut: isLoading };
}
