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

export const BackgroundContext = createContext<BackgroundContextType | undefined>(
	undefined,
);

// Module-level caches — survive component remounts within the same JS session.
let cachedCameraPosition = 0;
let cachedPageIndex = 0;
let cachedAssetsLoaded = false;

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [cameraPosition, setCameraPositionRaw] = useState(() => cachedCameraPosition);
	const [currentPageIndex, setCurrentPageIndexRaw] = useState(() => cachedPageIndex);

	const [isAssetsLoading, setIsAssetsLoadingRaw] = useState(true);

	useLayoutEffect(() => {
		if (cachedAssetsLoaded || sessionStorage.getItem('assets-loaded') === 'true') {
			cachedAssetsLoaded = true;
			// sessionStorage is client-only; restore the "already loaded" state.
			// eslint-disable-next-line react-hooks/set-state-in-effect
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
		// Gallery has its own camera position (monitor zoom) outside the nav
		if (pathname === '/gallery') {
			setCurrentPageIndex(5);
			setCameraPosition(5);
			return;
		}

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
		// Keep the wheel-nav index and camera position in sync with the route.
		// eslint-disable-next-line react-hooks/set-state-in-effect
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
		return {
			cameraPosition: 0,
			setCameraPosition: () => {},
			currentPageIndex: 0,
			setCurrentPageIndex: () => {},
			isAssetsLoading: false,
			setIsAssetsLoading: () => {},
			loadingProgress: 100,
			setLoadingProgress: () => {},
			isCameraMoving: false,
			setIsCameraMoving: () => {},
		};
	}
	return context;
};
