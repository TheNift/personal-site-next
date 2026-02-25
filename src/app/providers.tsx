"use client";

import { BackgroundProvider } from '@/contexts/BackgroundContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { UIProvider } from '@/contexts/UIContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<LanguageProvider>
			<BackgroundProvider>
				<UIProvider>
					{children}
				</UIProvider>
			</BackgroundProvider>
		</LanguageProvider>
	);
}
