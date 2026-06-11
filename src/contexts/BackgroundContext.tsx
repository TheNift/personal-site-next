'use client';

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from 'react';
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
	undefined,
);

// Module-level caches — survive component remounts within the same JS session.
let cachedCameraPosition = 0;
let cachedPageIndex = 0;
let cachedAssetsLoaded = false;

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	// Camera/page state: module cache preserves across remounts.
	const [cameraPosition, setCameraPositionRaw] = useState(() => cachedCameraPosition);
	const [currentPageIndex, setCurrentPageIndexRaw] = useState(() => cachedPageIndex);

	// CRITICAL: Always initialize as true to match SSR output.
	// The actual value is set in useLayoutEffect (before browser paint) to
	// avoid both hydration mismatch AND visual flash.
	const [isAssetsLoading, setIsAssetsLoadingRaw] = useState(true);

	// useLayoutEffect runs after React commits DOM but BEFORE browser paints.
	// This means: hydration sees true (matches SSR) → layout effect fires →
	// sets to false → browser paints with false. No hydration mismatch, no flash.
	useLayoutEffect(() => {
		if (cachedAssetsLoaded || sessionStorage.getItem('assets-loaded') === 'true') {
			cachedAssetsLoaded = true;
			setIsAssetsLoadingRaw(false);
		}
	}, []);

	const setCameraPosition = useCallback((index: number) => {
		cachedCameraPosition = index;
		setCameraPositionRaw(index);
	}, []);

	const setCurrentPageIndex = useCallback((index: number) => {
		cachedPageIndex = index;
		setCurrentPageIndexRaw(index);
	}, []);

	const setIsAssetsLoading = useCallback((loading: boolean) => {
		if (!loading) {
			sessionStorage.setItem('assets-loaded', 'true');
			cachedAssetsLoaded = true;
		}
		setIsAssetsLoadingRaw(loading);
	}, []);

	const [loadingProgress, setLoadingProgress] = useState(0);
	const [isCameraMoving, setIsCameraMoving] = useState(true);
	const { strings } = useLanguage();
	const pathname = usePathname() || '/';

	const updatePageIndex = useCallback(() => {
		const navItems = strings.ui?.nav;
		if (!navItems?.length) return;
		let matchedIndex = 0;

		for (let i = 0; i < navItems.length; i++) {
			const navItem = navItems[i];

			if (pathname === navItem.to) {
				matchedIndex = i;
				break;
			}

			if (navItem.to !== '/' && pathname.startsWith(navItem.to + '/')) {
				matchedIndex = i;
				break;
			}
		}

		setCurrentPageIndex(matchedIndex);
		setCameraPosition(matchedIndex);
	}, [pathname, strings.ui?.nav, setCurrentPageIndex, setCameraPosition]);

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
			'useBackground must be used within a BackgroundProvider',
		);
	}
	return context;
};
