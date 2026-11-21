'use client';

import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

interface UIContextType {
	isContentHidden: boolean;
	setContentHidden: (hidden: boolean) => void;
	toggleContentHidden: () => void;
	isGameRunning: boolean;
	setGameRunning: (running: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
	children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
	const [isContentHidden, setIsContentHidden] = useState(false);
	const [isGameRunning, setIsGameRunning] = useState(false);

	const toggleContentHidden = useCallback(() => {
		setIsContentHidden((prev) => !prev);
	}, []);

	const value = useMemo(
		() => ({
			isContentHidden,
			setContentHidden: setIsContentHidden,
			toggleContentHidden,
			isGameRunning,
			setGameRunning: setIsGameRunning,
		}),
		[isContentHidden, isGameRunning, toggleContentHidden]
	);

	return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
	const context = useContext(UIContext);
	if (context === undefined) {
		throw new Error('useUI must be used within a UIProvider');
	}
	return context;
};
