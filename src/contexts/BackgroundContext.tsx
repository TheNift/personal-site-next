"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import { usePathname } from 'next/navigation';

interface BackgroundContextType {
	cameraPosition: number;
	setCameraPosition: (index: number) => void;
	currentPageIndex: number;
	setCurrentPageIndex: (index: number) => void;
	isAssetsLoading: boolean;
	setIsAssetsLoading: (loading: boolean) => void;
	loadingProgress: number;
	setLoadingProgress: (progress: number) => void;
	isCameraMoving: boolean;
	setIsCameraMoving: (index: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
	undefined
);

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [cameraPosition, setCameraPosition] = useState(0);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [isAssetsLoading, setIsAssetsLoading] = useState(true);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [isCameraMoving, setIsCameraMoving] = useState(true);
	const { strings } = useLanguage();
	const pathname = usePathname() || '/';

	const updatePageIndex = useCallback(() => {
		const navItems = strings.ui.nav;
		let matchedIndex = 0;

		for (let i = 0; i < navItems.length; i++) {
			const navItem = navItems[i];

			if (pathname === navItem.to) {
				matchedIndex = i;
				break;
			}

			if (
				navItem.to !== '/' &&
				pathname.startsWith(navItem.to + '/')
			) {
				matchedIndex = i;
				break;
			}
		}

		setCurrentPageIndex(matchedIndex);
		setCameraPosition(matchedIndex);
	}, [pathname, strings.ui.nav]);

	useEffect(() => {
		updatePageIndex();
	}, [updatePageIndex]);

	return (
		<BackgroundContext.Provider
			value={{
				cameraPosition,
				setCameraPosition,
				currentPageIndex,
				setCurrentPageIndex,
				isAssetsLoading,
				setIsAssetsLoading,
				loadingProgress,
				setLoadingProgress,
				isCameraMoving,
				setIsCameraMoving,
			}}
		>
			{children}
		</BackgroundContext.Provider>
	);
};

export const useBackground = (): BackgroundContextType => {
	const context = useContext(BackgroundContext);
	if (context === undefined) {
		throw new Error(
			'useBackground must be used within a BackgroundProvider'
		);
	}
	return context;
};
