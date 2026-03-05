'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Suspense, ReactNode, useContext, useRef } from 'react';
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useUI } from '@/contexts/UIContext';

function FrozenRouter({ children }: { children: ReactNode }) {
	const context = useContext(LayoutRouterContext);
	const frozenContext = useRef(context);
	return (
		<LayoutRouterContext.Provider value={frozenContext.current}>
			{children}
		</LayoutRouterContext.Provider>
	);
}

function AnimatedOutlet({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const { isContentHidden } = useUI();
	return (
		<AnimatePresence
			mode='wait'
			propagate={true}
		>
			{children && (
				<div
					key={pathname}
					className={`w-full h-full ${isContentHidden ? 'opacity-0' : 'opacity-100'} transition-all duration-300 ease-in-out`}
				>
					<FrozenRouter>
						<Suspense
							fallback={
								<div className='w-full h-full flex items-center justify-center'>
									Loading...
								</div>
							}
						>
							{children}
						</Suspense>
					</FrozenRouter>
				</div>
			)}
		</AnimatePresence>
	);
}

export default AnimatedOutlet;
