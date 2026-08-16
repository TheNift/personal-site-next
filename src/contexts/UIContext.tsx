'use client';

import React, {
	createContext,
	useContext,
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

	const setContentHidden = (hidden: boolean) => {
		setIsContentHidden(hidden);
	};

	const setNavHidden = (hidden: boolean) => {
		setIsNavHidden(hidden);
	};

	const toggleContentHidden = () => {
		setIsContentHidden((prev) => !prev);
	};

	const value = {
		isContentHidden,
		setContentHidden,
		toggleContentHidden,
		isNavHidden,
		setNavHidden,
	};

	return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
	const context = useContext(UIContext);
	if (context === undefined) {
		throw new Error('useUI must be used within a UIProvider');
	}
	return context;
};
