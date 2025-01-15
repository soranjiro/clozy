"use client";

import { createContext, useState, ReactNode } from 'react';

interface User {
	username: string;
	email: string;
}

interface UserContextProps {
	user: User | null;
	setUser: (user: User | null) => void;
	logout: () => void;
}

export const UserContext = createContext<UserContextProps>({
	user: null,
	setUser: () => {},
	logout: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);

	const logout = () => {
		setUser(null);
	};

	return (
		<UserContext.Provider value={{ user, setUser, logout }}>
			<div>
				{children}
			</div>
		</UserContext.Provider>
	);
};
