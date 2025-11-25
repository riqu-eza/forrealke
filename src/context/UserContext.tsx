"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface UserContextType {
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: any) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  const login = (user: any) => setUser(user);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
