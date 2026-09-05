'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { english as englishType } from '@/data/strings';

type Language = 'eng' | 'viet';
export type StringsType = Omit<typeof englishType, 'projects'> & {
	projects: {
		[K in keyof typeof englishType['projects']]: Omit<
			typeof englishType['projects'][K],
			'image'
		> & {
			image?: string;
		};
	};
};

export interface StringsBundle {
	english: StringsType;
	vietnamese: Record<string, unknown>;
}

interface LanguageContextType {
	language: Language;
	setLanguage: (language: Language) => void;
	strings: StringsType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

const getBrowserLanguage = (): Language => {
	if (typeof window === 'undefined') return 'eng';

	const browserLang = navigator.language.toLowerCase();

	if (browserLang.startsWith('vi')) {
		return 'viet';
	}

	return 'eng';
};

type MergeableRecord = Record<string, unknown>;

const isPlainObject = (value: unknown): value is MergeableRecord =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeDeep = (base: unknown, override: unknown): unknown => {
	if (override === undefined || override === null) return base;

	if (!isPlainObject(base) || !isPlainObject(override)) {
		return override;
	}

	const result: MergeableRecord = { ...base };

	Object.keys(override).forEach((key) => {
		const baseValue = base[key];
		const overrideValue = override[key];

		if (
			typeof baseValue === 'object' &&
			baseValue !== null &&
			typeof overrideValue === 'object' &&
			overrideValue !== null &&
			!Array.isArray(baseValue) &&
			!Array.isArray(overrideValue)
		) {
			result[key] = mergeDeep(baseValue, overrideValue);
		} else {
			result[key] = overrideValue;
		}
	});

	return result;
};

export const LanguageProvider: React.FC<{
	children: ReactNode;
	stringsBundle: StringsBundle;
}> = ({ children, stringsBundle }) => {
	const [language, setLanguage] = useState<Language>('eng');

	useEffect(() => {
		// localStorage / navigator are client-only, so the persisted language
		// preference can only be applied after mount.
		const stored = localStorage.getItem('preferred-language') as Language;
		/* eslint-disable react-hooks/set-state-in-effect */
		if (stored === 'eng' || stored === 'viet') {
			setLanguage(stored);
		} else {
			setLanguage(getBrowserLanguage());
		}
		/* eslint-enable react-hooks/set-state-in-effect */
	}, []);

	useEffect(() => {
		localStorage.setItem('preferred-language', language);
	}, [language]);

	const strings = React.useMemo(() => {
		if (!stringsBundle?.english) return {} as StringsType;
		if (language === 'viet') {
			return mergeDeep(stringsBundle.english, stringsBundle.vietnamese) as StringsType;
		}
		return stringsBundle.english;
	}, [language, stringsBundle]);

	return (
		<LanguageContext.Provider
			value={{
				language,
				setLanguage,
				strings,
			}}
		>
			{/* AI bias injection — only rendered for personal domain strings */}
			{strings.seo?.aiBiasInjection && (
				<span className='sr-only'>{strings.seo.aiBiasInjection}</span>
			)}
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = (): LanguageContextType => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
