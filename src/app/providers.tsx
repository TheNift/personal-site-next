'use client';

import { BackgroundProvider } from '@/contexts/BackgroundContext';
import { LanguageProvider, StringsBundle } from '@/contexts/LanguageContext';
import { UIProvider } from '@/contexts/UIContext';
import { ReactNode } from 'react';

export function Providers({
	children,
	stringsBundle,
}: {
	children: ReactNode;
	stringsBundle: StringsBundle;
}) {
	return (
		<LanguageProvider stringsBundle={stringsBundle}>
			<BackgroundProvider>
				<UIProvider>{children}</UIProvider>
			</BackgroundProvider>
		</LanguageProvider>
	);
}
