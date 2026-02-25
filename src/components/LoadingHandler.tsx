"use client";

import { useEffect, ReactNode } from 'react';
import GlobalUI from '@/components/GlobalUI';
import { useBackground } from '@/contexts/BackgroundContext';

const LoadingHandler = ({ children }: { children: ReactNode }) => {
	const { setIsAssetsLoading, setLoadingProgress } = useBackground();
	useEffect(() => {
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
	}, [setIsAssetsLoading, setLoadingProgress]);

	return (
		<GlobalUI>
			{children}
		</GlobalUI>
	);
};

export default LoadingHandler;