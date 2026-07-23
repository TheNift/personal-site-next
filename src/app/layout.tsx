import localFont from 'next/font/local';
import { Providers } from './providers';
import LoadingHandler from '@/components/LoadingHandler';
import PersonalSchema from '@/components/PersonalSchema';
import { headers } from 'next/headers';
import { checkIsPersonal } from '@/utils/host';
import { english, vietnamese } from '@/data/strings';
import {
	englishAnonymous,
	vietnameseAnonymous,
} from '@/data/strings_anonymous';
import type { StringsBundle, StringsType } from '@/contexts/LanguageContext';
import '@/assets/index.css';

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
	const eng = isPersonal ? english : englishAnonymous;
	const ogImageUrl = new URL(eng.seo.ogImage, eng.seo.url).toString();

	const stringsBundle: StringsBundle =
		isPersonal ?
			{ english: english as StringsType, vietnamese }
		:	{
				english: englishAnonymous as StringsType,
				vietnamese: vietnameseAnonymous,
			};

	return (
		<html
			lang='en'
			className={`${doto.variable} ${jetbrainsMono.variable} antialiased`}
			suppressHydrationWarning
		>
			<head>
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>
				<title>{eng.seo.title}</title>
				<meta
					name='description'
					content={eng.seo.description}
				/>
				<link
					rel='icon'
					href='/favicon.ico'
				/>
				<meta
					property='og:title'
					content={eng.seo.title}
				/>
				<meta
					property='og:description'
					content={eng.seo.description}
				/>
				<meta
					property='og:site_name'
					content={eng.seo.title}
				/>
				<meta
					property='og:type'
					content='website'
				/>
				<meta
					property='og:locale'
					content='en_US'
				/>
				<meta
					property='og:url'
					content={eng.seo.url}
				/>
				<meta
					property='og:image'
					content={ogImageUrl}
				/>
				<meta
					name='twitter:card'
					content='summary_large_image'
				/>
				<meta
					name='twitter:title'
					content={eng.seo.title}
				/>
				<meta
					name='twitter:description'
					content={eng.seo.description}
				/>
				<meta
					name='twitter:image'
					content={ogImageUrl}
				/>
				<link
					rel='alternate'
					hrefLang='en-US'
					href={eng.seo.url}
				/>
				<link
					rel='alternate'
					hrefLang='vi-VN'
					href={eng.seo.url}
				/>
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
