"use client";

import AnimatedOutlet from '@/components/AnimatedOutlet';
import LanguageToggle from '@/components/LanguageToggle';
import NavUI from '@/components/NavUI';
import { lazy, Suspense, ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import LoadingScreen from './LoadingScreen';
import { useBackground } from '@/contexts/BackgroundContext';

const BackgroundScene = lazy(() => import('@/components/BackgroundScene'));

function GlobalUI({ children }: { children: ReactNode }) {
	const pathname = usePathname() || '/';
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isPortfolio = pathname.startsWith('/portfolio');
	const isContact = pathname === '/contact';
	const isInteractive = mounted && (isPortfolio || isContact);

	return (
		<div className="h-screen w-screen relative bg-site-bg">
			<div
				className={`relative h-full w-full z-40 flex flex-col items-center justify-center ${
					isInteractive ? 'pointer-events-none' : ''
				}`}
			>
				<NavUI />
				<div className="absolute bottom-4 right-4 z-50 hidden md:block">
					<ToggleButtonsContainer />
				</div>
				<AnimatedOutlet>{children}</AnimatedOutlet>
			</div>
			<LoadingModal />
			<div className="absolute inset-0 z-0 bg-site-bg">
				<Suspense
					fallback={<div className="w-full h-full bg-inherit" />}
				>
					<BackgroundScene />
				</Suspense>
			</div>
		</div>
	);
}

function ToggleButtonsContainer() {
	const { isAssetsLoading } = useBackground();
	return (
		<AnimatePresence>
			{!isAssetsLoading && (
				<div className="absolute bottom-4 right-4 z-50 flex flex-row gap-4 pointer-events-auto">
					<LanguageToggle />
				</div>
			)}
		</AnimatePresence>
	);
}

function LoadingModal() {
	const { isAssetsLoading } = useBackground();
	return (
		<AnimatePresence>
			{isAssetsLoading && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					exit={{
						opacity: 0,
						y: 20,
						transition: { delay: 0.5, duration: 0.3 },
					}}
					className="absolute z-30 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
				>
					<LoadingScreen />
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default GlobalUI;