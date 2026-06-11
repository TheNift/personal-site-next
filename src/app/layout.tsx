import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import LoadingHandler from '@/components/LoadingHandler';
import PersonalSchema from '@/components/PersonalSchema';
import { headers } from 'next/headers';
import { checkIsPersonal } from '@/utils/host';
import { english, vietnamese } from '@/data/strings';
import { englishAnonymous, vietnameseAnonymous } from '@/data/strings_anonymous';
import type { StringsBundle, StringsType } from '@/contexts/LanguageContext';
import '@/assets/index.css';

export async function generateMetadata(): Promise<Metadata> {
	const headersList = await headers();
	const host = headersList.get('host') || '';
	const isPersonal = checkIsPersonal(host);
	const eng = isPersonal ? english : englishAnonymous;

	return {
		title: eng.seo.title,
		description: eng.seo.description,
		icons: { icon: '/favicon.ico' },
		openGraph: {
			images: eng.seo.ogImage,
			siteName: eng.seo.title,
			locale: 'en_US',
			type: 'website',
			url: eng.seo.url,
			description: eng.seo.description,
		},
		alternates: {
			languages: {
				'en-US': eng.seo.url,
				'vi-VN': eng.seo.url,
			},
		},
	};
}

const doto = localFont({
	src: '/fonts/Doto-Variable.ttf',
	display: 'swap',
	weight: '100 900',
	variable: '--font-doto',
	preload: true,
});

const jetbrainsMono = localFont({
	src: '/fonts/JetBrainsMono-Variable.ttf',
	display: 'swap',
	weight: '100 900',
	variable: '--font-jetbrains-mono',
	preload: true,
});

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const headersList = await headers();
	const host = headersList.get('host') || '';
	const isPersonal = checkIsPersonal(host);

	const stringsBundle: StringsBundle = isPersonal 
		? { english: english as StringsType, vietnamese }
		: { english: englishAnonymous as StringsType, vietnamese: vietnameseAnonymous };

	return (
		<html
			lang='en'
			className={`${doto.variable} ${jetbrainsMono.variable} antialiased`}
			suppressHydrationWarning
		>
			<head>
				<meta charSet='utf-8' />
				<PersonalSchema isPersonal={isPersonal} />
			</head>
			<body suppressHydrationWarning>
				<Providers stringsBundle={stringsBundle}>
					<LoadingHandler>{children}</LoadingHandler>
				</Providers>
			</body>
		</html>
	);
}
