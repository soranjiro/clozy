"use client";

import { createContext, useState, ReactNode } from 'react';
import { useRouter } from "next/navigation";

import { logout } from '@/api/user';

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
    await logout();
    document.cookie =
      "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    router.push("/login");
  };

	return (
    <UserContext.Provider value={{ user, setUser, userLogout }}>
      <div>{children}</div>
    </UserContext.Provider>
  );
};
