import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  gender?: "male" | "female" | "other" | "unspecified";
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  isAuthenticated: boolean;
}

const getStoredItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  const data = getStoredItem("trackkaro_user");
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

// Restore a previous session from localStorage; with nothing stored, start logged out.
const initialUser = getStoredUser();
const initialToken = getStoredItem("trackkaro_access_token");

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialToken,
  refreshToken: getStoredItem("trackkaro_refresh_token"),
  accessTokenExpiresAt: getStoredItem("trackkaro_token_expires"),
  isAuthenticated: Boolean(initialUser && initialToken),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt?: string;
      }>
    ) => {
      const { user, accessToken, refreshToken, accessTokenExpiresAt } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.accessTokenExpiresAt = accessTokenExpiresAt || null;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("trackkaro_user", JSON.stringify(user));
          localStorage.setItem("trackkaro_access_token", accessToken);
          localStorage.setItem("trackkaro_refresh_token", refreshToken);
          if (accessTokenExpiresAt) {
            localStorage.setItem("trackkaro_token_expires", accessTokenExpiresAt);
          }
        } catch {
          // ignore localStorage errors (e.g. storage quota, private mode)
        }
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("trackkaro_user", JSON.stringify(state.user));
          } catch {}
        }
      }
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.accessTokenExpiresAt = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("trackkaro_user");
          localStorage.removeItem("trackkaro_access_token");
          localStorage.removeItem("trackkaro_refresh_token");
          localStorage.removeItem("trackkaro_token_expires");
        } catch {}
      }
    },
  },
});

export const { setCredentials, updateUser, logOut } = authSlice.actions;

export default authSlice.reducer;
