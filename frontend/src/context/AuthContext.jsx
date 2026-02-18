import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../api";

const AuthContext = createContext(null);

function parseStoredUser() {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => parseStoredUser());
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const persistAuth = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
    }

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    }
  };

  const fetchCurrentUser = async () => {
    const { data } = await api.get("/users/me");
    persistAuth(token, data.user);
    return data.user;
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    fetchCurrentUser()
      .catch(() => {
        persistAuth(null, null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persistAuth(data.token, data.user);
    return data.user;
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    persistAuth(data.token, data.user);
    return data.user;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/users/update", payload);
    persistAuth(token, data.user);
    return data.user;
  };

  const logout = () => {
    persistAuth(null, null);
  };

  const value = useMemo(() => {
    return {
      token,
      user,
      isLoading,
      register,
      login,
      logout,
      fetchCurrentUser,
      updateProfile,
    };
  }, [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

