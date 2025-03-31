"use client";

import { createContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { logout } from "@/api/user";

interface User {
  username: string;
  email: string;
}

interface UserContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  userLogout: () => void;
}

export const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => {},
  userLogout: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const userLogout = async () => {
    try {
      logout();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, userLogout }}>
      <div>{children}</div>
    </UserContext.Provider>
  );
};
