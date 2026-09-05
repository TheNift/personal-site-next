'use client';

import { BackgroundProvider } from '@/contexts/BackgroundContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { UIProvider } from '@/contexts/UIContext';
import { ReactNode } from 'react';

import type { StringsBundle } from '@/contexts/LanguageContext';

export function Providers({ children, stringsBundle }: { children: ReactNode; stringsBundle: StringsBundle }) {
	return (
		<LanguageProvider stringsBundle={stringsBundle}>
			<BackgroundProvider>
				<UIProvider>{children}</UIProvider>
			</BackgroundProvider>
		</LanguageProvider>
	);
}
