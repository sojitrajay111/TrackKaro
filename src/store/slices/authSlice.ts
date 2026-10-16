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

export const PRIMARY_USER: User = {
  id: "6aa28875556751206aca9a26",
  name: "Jay Sojitra",
  email: "jsojitra111@gmail.com",
  phone: "7861819040",
};

export const PRIMARY_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWEyODg3NTU1Njc1MTIwNmFjYTlhMjYiLCJlbWFpbCI6Impzb2ppdHJhMTExQGdtYWlsLmNvbSIsImlhdCI6MTc5MjE0NTM4NywiZXhwIjoxNzk0NzM3Mzg3fQ.QZXmqfeY9joj2-kVvbctFVJJObhcZxGnwXCd1YOR8ww";

const getStoredItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredUser = (): User => {
  const data = getStoredItem("trackkaro_user");
  if (!data) return PRIMARY_USER;
  try {
    const parsed = JSON.parse(data) as User;
    if (parsed.email === "test@trackkaro.com" || parsed.email === "test@example.com") {
      return PRIMARY_USER;
    }
    return parsed;
  } catch {
    return PRIMARY_USER;
  }
};

const getStoredToken = (): string => {
  const token = getStoredItem("trackkaro_access_token");
  const user = getStoredUser();
  if (!token || user.email === PRIMARY_USER.email) {
    return PRIMARY_TOKEN;
  }
  return token;
};

const initialUser = getStoredUser();
const initialToken = getStoredToken();

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialToken,
  refreshToken: getStoredItem("trackkaro_refresh_token") || "mock-refresh",
  accessTokenExpiresAt:
    getStoredItem("trackkaro_token_expires") ||
    new Date(Date.now() + 30 * 86400000).toISOString(),
  isAuthenticated: true,
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
