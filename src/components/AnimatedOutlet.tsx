"use client";

import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Suspense, ReactNode } from 'react';
import { useUI } from '@/contexts/UIContext';

function AnimatedOutlet({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const { isContentHidden } = useUI();
	return (
		<AnimatePresence mode="wait" propagate={true}>
			{children && (
				<div
					key={pathname}
					className={`w-full h-full ${isContentHidden ? 'opacity-0' : 'opacity-100'} transition-all duration-300 ease-in-out`}
				>
					<Suspense
						fallback={
							<div className="w-full h-full flex items-center justify-center">
								Loading...
							</div>
						}
					>
						{children}
					</Suspense>
				</div>
			)}
		</AnimatePresence>
	);
}

export default AnimatedOutlet;