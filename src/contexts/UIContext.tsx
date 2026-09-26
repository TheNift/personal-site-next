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
	isNavHidden: boolean;
	setNavHidden: (hidden: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
	children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
	const [isContentHidden, setIsContentHidden] = useState(false);
	const [isNavHidden, setIsNavHidden] = useState(false);

	const toggleContentHidden = useCallback(() => {
		setIsContentHidden((prev) => !prev);
	}, []);

	const value = useMemo(
		() => ({
			isContentHidden,
			setContentHidden: setIsContentHidden,
			toggleContentHidden,
			isNavHidden,
			setNavHidden: setIsNavHidden,
		}),
		[isContentHidden, isNavHidden, toggleContentHidden]
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
