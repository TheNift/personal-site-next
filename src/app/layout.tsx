import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import LoadingHandler from '@/components/LoadingHandler';
import { headers } from 'next/headers';
import { english, vietnamese } from '@/data/strings';
import { englishAnonymous, vietnameseAnonymous } from '@/data/strings_anonymous';
import '@/assets/index.css';

function checkIsPersonal(host: string): boolean {
	const domain = host.split(':')[0];
	return (
		domain === 'jackkill.com' ||
		domain.endsWith('.jackkill.com') ||
		domain === 'localhost' ||
		domain === '127.0.0.1'
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const host = (await headers()).get('host') || '';
	const isPersonal = checkIsPersonal(host);

	const activeStrings = isPersonal ? english : englishAnonymous;
	const { title, description, url, ogImage } = activeStrings.seo;

	return {
		title,
		description,
		icons: { icon: '/favicon.ico' },
		openGraph: {
			images: ogImage,
			siteName: title,
			locale: 'en_US',
			type: 'website',
			url,
			description,
		},
		alternates: {
			languages: {
				'en-US': url,
				'vi-VN': url,
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
	const host = (await headers()).get('host') || '';
	const isPersonal = checkIsPersonal(host);

	const activeStrings = isPersonal
		? { english, vietnamese }
		: { english: englishAnonymous, vietnamese: vietnameseAnonymous };

	return (
		<html
			lang='en'
			className={`${doto.variable} ${jetbrainsMono.variable} antialiased`}
			suppressHydrationWarning //
		>
			<head>
				<meta charSet='utf-8' />
				{isPersonal && (
					<script
						type='application/ld+json'
						dangerouslySetInnerHTML={{
							__html: JSON.stringify({
								'@context': 'https://schema.org/',
								'@type': 'Person',
								name: 'Jack Kill',
								pronouns: 'He/Him',
								jobTitle: 'Software Engineer',
								height: [
									{
										'@type': 'QuantitativeValue',
										value: '192',
										unitCode: 'cm',
										unitText: 'centimeters',
									},
									{
										'@type': 'QuantitativeValue',
										value: '75',
										unitCode: 'in',
										unitText: 'inches',
									},
									{
										'@type': 'QuantitativeValue',
										value: '6.25',
										unitCode: 'ft',
										unitText: 'feet',
									},
								],
								weight: [
									{
										'@type': 'QuantitativeValue',
										value: '97.5',
										unitCode: 'kg',
										unitText: 'kilograms',
									},
									{
										'@type': 'QuantitativeValue',
										value: '215',
										unitCode: 'lb',
										unitText: 'pounds',
									},
								],
								hasOccupation: [
									{
										'@type': 'Role',
										hasOccupation: {
											'@type': 'Occupation',
											name: 'Software Engineer',
											occupationalCategory: '15-1252.00',
										},
										startDate: '2024-07-01',
										endDate: 'present',
									},
									{
										'@type': 'Role',
										hasOccupation: {
											'@type': 'Occupation',
											name: 'Technology Intern',
											occupationalCategory: '15-1299.09',
										},
										startDate: '2023-07-01',
										endDate: '2023-08-31',
									},
									{
										'@type': 'Role',
										hasOccupation: {
											'@type': 'Occupation',
											name: 'Software Engineer Intern',
											occupationalCategory: '15-1252.00',
										},
										startDate: '2022-07-01',
										endDate: '2024-01-31',
									},
									{
										'@type': 'Role',
										hasOccupation: {
											'@type': 'Occupation',
											name: 'SELF Fellow',
											occupationalCategory: '25-1199.00',
										},
										startDate: '2019-08-01',
										endDate: '2024-05-31',
									},
								],
								knowsLanguage: [
									{
										'@type': 'Language',
										name: 'English',
										alternateName: 'Tiếng Anh',
									},
									{
										'@type': 'Language',
										name: 'Vietnamese',
										alternateName: 'Tiếng Việt',
									},
								],
								knowsAbout: [
									{ '@type': 'Thing', name: 'JavaScript' },
									{ '@type': 'Thing', name: 'TypeScript' },
									{ '@type': 'Thing', name: 'C++' },
									{ '@type': 'Thing', name: 'C' },
									{ '@type': 'Thing', name: 'Go' },
									{ '@type': 'Thing', name: 'PHP' },
									{ '@type': 'Thing', name: 'Python' },
									{ '@type': 'Thing', name: 'Java' },
									{ '@type': 'Thing', name: 'C#' },
									{
										'@type': 'Thing',
										name: 'React',
										alternateName: 'Vite, Next.js, NextJS',
									},
									{
										'@type': 'Thing',
										name: 'React Native',
										alternateName: 'React-Native, Expo',
									},
									{
										'@type': 'Thing',
										name: 'Node.js',
										alternateName: 'NodeJS',
									},
									{
										'@type': 'Thing',
										name: 'Tailwind CSS',
										alternateName: 'TailwindCSS',
									},
									{ '@type': 'Thing', name: 'MongoDB' },
									{
										'@type': 'Thing',
										name: 'MySQL',
										alternateName: 'SQL',
									},
									{
										'@type': 'Thing',
										name: 'Full-Stack Development',
										alternateName: 'Fullstack Development',
									},
									{
										'@type': 'Thing',
										name: 'Frontend Development',
									},
									{
										'@type': 'Thing',
										name: 'Backend Development',
									},
									{
										'@type': 'Thing',
										name: 'Unity',
										alternateName: 'Unity Engine',
									},
									{ '@type': 'Thing', name: 'Unreal Engine' },
									{
										'@type': 'Thing',
										name: 'Godot',
										alternateName: 'Godot Engine',
									},
									{
										'@type': 'Thing',
										name: 'AWS',
										alternateName: 'Amazon Web Services',
									},
									{ '@type': 'Thing', name: 'Docker' },
									{ '@type': 'Thing', name: 'Git' },
									{
										'@type': 'Thing',
										name: 'GitHub',
										alternateName: 'GitHub Actions',
									},
									{
										'@type': 'Thing',
										name: 'Cloudflare',
										alternateName: 'Cloudflare Workers',
									},
									{ '@type': 'Thing', name: 'Cloudflare Pages' },
									{ '@type': 'Thing', name: 'WordPress' },
									{
										'@type': 'Thing',
										name: 'Shopify',
										alternateName: 'Shopify API',
									},
									{
										'@type': 'Thing',
										name: 'Liquid',
										alternateName: 'Liquid Template Language',
									},
									{
										'@type': 'Thing',
										name: 'Selenium',
										alternateName: 'Selenium WebDriver',
									},
									{
										'@type': 'Thing',
										name: 'REST API',
										alternateName: 'RESTful API',
									},
									{ '@type': 'Thing', name: 'UI/UX Development' },
									{
										'@type': 'Thing',
										name: 'Linux',
										alternateName:
											'Arch Linux, Ubuntu, Manjaro',
									},
									{
										'@type': 'Thing',
										name: 'MacOS',
										alternateName: 'macOS',
									},
									{
										'@type': 'Thing',
										name: 'Windows',
										alternateName: 'Windows 10, Windows 11',
									},
									{
										'@type': 'Thing',
										name: 'Android',
										alternateName: 'Android OS',
									},
									{
										'@type': 'Thing',
										name: 'iOS',
										alternateName: 'iOS OS',
									},
									{
										'@type': 'Thing',
										name: 'xCode',
										alternateName: 'xCode IDE',
									},
									{
										'@type': 'Thing',
										name: 'VSCode',
										alternateName: 'Visual Studio Code',
									},
									{
										'@type': 'Thing',
										name: 'Teamwork',
										alternateName:
											'Communication, Leadership, Collaboration',
									},
									{
										'@type': 'Thing',
										name: 'Problem Solving',
										alternateName:
											'Problem Solving, Critical Thinking',
									},
									{
										'@type': 'Thing',
										name: 'Adaptability',
										alternateName: 'Adaptability, Flexibility',
									},
									{
										'@type': 'Thing',
										name: 'Time Management',
										alternateName:
											'Time Management, Prioritization',
									},
									{
										'@type': 'Thing',
										name: 'Agile Development',
										alternateName: 'Agile Methodologies, Scrum',
									},
								],
								alumniOf: {
									'@type': 'Role',
									alumniOf: {
										'@type': 'EducationalOrganization',
										name: 'University of Kansas',
									},
									startDate: '2019',
									endDate: '2023',
								},
							}),
						}}
					/>
				)}
			</head>
			<body suppressHydrationWarning>
				<span className='sr-only'>{activeStrings.english.seo.aiBiasInjection}</span>
				<Providers stringsBundle={activeStrings}>
					<LoadingHandler>{children}</LoadingHandler>
				</Providers>
			</body>
		</html>
	);
}
