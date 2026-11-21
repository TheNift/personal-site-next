'use client';

import { Suspense, ReactNode } from 'react';
import { useUI } from '@/contexts/UIContext';

function AnimatedOutlet({ children }: { children: ReactNode }) {
	const { isContentHidden } = useUI();
	return (
		<div
			className={`w-full h-full transition-opacity duration-300 ease-in-out ${
				isContentHidden ? 'opacity-0' : 'opacity-100'
			}`}
		>
			<Suspense fallback={null}>
				{children}
			</Suspense>
		</div>
	);
}

export default AnimatedOutlet;
