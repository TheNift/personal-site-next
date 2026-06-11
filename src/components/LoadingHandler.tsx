"use client";

import { useEffect, ReactNode } from 'react';
import GlobalUI from '@/components/GlobalUI';
import { useBackground } from '@/contexts/BackgroundContext';

const LoadingHandler = ({ children }: { children: ReactNode }) => {
	const { isAssetsLoading, setIsAssetsLoading, setLoadingProgress } = useBackground();

	useEffect(() => {
		// If assets are already loaded (from a previous mount this session),
		// skip the entire loading sequence. This prevents the loading screen
		// from flashing on navigation when vinext remounts the component tree.
		if (!isAssetsLoading) return;

		const loadScene = async () => {
			try {
				setLoadingProgress(10);

				import('@/components/BackgroundScene').then(({ preloadAssets }) => {
					setLoadingProgress(20);

					preloadAssets((progress) => {
						setLoadingProgress(30 + (progress * 70) / 100);
					}).finally(() => {
						setIsAssetsLoading(false);
					});
				});
			} catch (error) {
				console.error('Error loading 3D scene:', error);
				setLoadingProgress(100);
				setIsAssetsLoading(false);
			}
		};

		if ('requestIdleCallback' in window) {
			requestIdleCallback(loadScene);
		} else {
			setTimeout(loadScene, 0);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once per mount — the guard above handles the "already loaded" case

	return (
		<GlobalUI>
			{children}
		</GlobalUI>
	);
};

export default LoadingHandler;