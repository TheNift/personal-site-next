'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminAuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (password: string) => Promise<{ success: boolean; error?: string }>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const router = useRouter();
	const pathname = usePathname();

	const checkAuth = useCallback(async (): Promise<boolean> => {
		try {
			const res = await fetch('/api/admin/verify');
			if (res.ok) {
				const data = (await res.json()) as { authenticated?: boolean };
				if (data.authenticated) {
					setIsAuthenticated(true);
					setIsLoading(false);
					return true;
				}
			}
		} catch {
			// Ignore network errors
		}
		setIsAuthenticated(false);
		setIsLoading(false);
		return false;
	}, []);

	useEffect(() => {
		// Session validation against the server; result must flow back into state.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		checkAuth();
	}, [checkAuth, pathname]);

	const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			});
			const data = (await res.json()) as { success?: boolean; error?: string };
			if (res.ok && data.success) {
				setIsAuthenticated(true);
				return { success: true };
			}
			return { success: false, error: data.error || 'Invalid password' };
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Login request failed',
			};
		}
	};

	const logout = async (): Promise<void> => {
		try {
			await fetch('/api/admin/logout', { method: 'POST' });
		} catch {
			// Ignore network errors
		}
		setIsAuthenticated(false);
		router.push('/admin/login');
	};

	return (
		<AdminAuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				login,
				logout,
				checkAuth,
			}}
		>
			{children}
		</AdminAuthContext.Provider>
	);
}

export function useAdminAuth(): AdminAuthContextType {
	const context = useContext(AdminAuthContext);
	if (!context) {
		throw new Error('useAdminAuth must be used within an AdminAuthProvider');
	}
	return context;
}
