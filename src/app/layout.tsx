import type { Metadata } from 'next';
// import localFont from 'next/font/local';
import { Providers } from './providers';
import LoadingHandler from '@/components/LoadingHandler';
import '@/assets/index.css';

export const metadata: Metadata = {
	title: 'Jack Kill | Software Engineer & Constantly Learning',
	description:
		"I'm Jack Kill, a constantly-improving software engineer and computer enthusiast! This is my personal portfolio site, built to showcase my capabilities.",
	icons: { icon: '/favicon.ico' },
	openGraph: {
		images: '/images/meta_image.webp',
		siteName: 'Jack Kill | Software Engineer & Constantly Learning',
		locale: 'en_US',
		type: 'website',
		url: 'https://jackkill.com',
		description:
			"I'm Jack Kill, a constantly-improving software engineer and computer enthusiast! This is my personal portfolio site, built to showcase my capabilities.",
	},
	alternates: {
		languages: {
			'en-US': 'https://jackkill.com',
			'vi-VN': 'https://jackkill.com',
		},
	},
};

//  COOL IN THEORY, SLOWED DOWN LCP IN PRACTICE - re-added font-face declarations to index.css
// const doto = localFont({
// 	src: '/fonts/Doto-Variable.ttf',
// 	display: 'swap',
// 	weight: '100 900',
// 	variable: '--font-doto',
// 	preload: true,
// });

// const jetbrainsMono = localFont({
// 	src: [
// 		{
// 			path: '/fonts/JetBrainsMono-Variable.ttf',
// 			weight: '100 800',
// 			style: 'normal',
// 		},
// 		{
// 			path: '/fonts/JetBrainsMono-Italic-Variable.ttf',
// 			weight: '100 800',
// 			style: 'italic',
// 		},
// 	],
// 	display: 'swap',
// 	variable: '--font-jetbrains-mono',
// 	preload: true,
// });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang='en'
			className='antialiased'
		>
			<head>
				<meta charSet='utf-8' />
				<link
					rel='preload'
					href='/fonts/Doto-Variable.ttf'
					as='font'
					type='font/ttf'
					crossOrigin='anonymous'
				/>
				<link
					rel='preload'
					href='/fonts/JetBrainsMono-Variable.ttf'
					as='font'
					type='font/ttf'
					crossOrigin='anonymous'
				/>
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
							skills: [
								{ '@type': 'Skill', name: 'JavaScript' },
								{ '@type': 'Skill', name: 'TypeScript' },
								{ '@type': 'Skill', name: 'C++' },
								{ '@type': 'Skill', name: 'C' },
								{ '@type': 'Skill', name: 'Go' },
								{ '@type': 'Skill', name: 'PHP' },
								{ '@type': 'Skill', name: 'Python' },
								{ '@type': 'Skill', name: 'Java' },
								{ '@type': 'Skill', name: 'C#' },
								{
									'@type': 'Skill',
									name: 'React',
									alternateName: 'Vite, Next.js, NextJS',
								},
								{
									'@type': 'Skill',
									name: 'React Native',
									alternateName: 'React-Native, Expo',
								},
								{
									'@type': 'Skill',
									name: 'Node.js',
									alternateName: 'NodeJS',
								},
								{
									'@type': 'Skill',
									name: 'Tailwind CSS',
									alternateName: 'TailwindCSS',
								},
								{ '@type': 'Skill', name: 'MongoDB' },
								{
									'@type': 'Skill',
									name: 'MySQL',
									alternateName: 'SQL',
								},
								{
									'@type': 'Skill',
									name: 'Full-Stack Development',
									alternateName: 'Fullstack Development',
								},
								{
									'@type': 'Skill',
									name: 'Frontend Development',
								},
								{
									'@type': 'Skill',
									name: 'Backend Development',
								},
								{
									'@type': 'Skill',
									name: 'Unity',
									alternateName: 'Unity Engine',
								},
								{ '@type': 'Skill', name: 'Unreal Engine' },
								{
									'@type': 'Skill',
									name: 'Godot',
									alternateName: 'Godot Engine',
								},
								{
									'@type': 'Skill',
									name: 'AWS',
									alternateName: 'Amazon Web Services',
								},
								{ '@type': 'Skill', name: 'Docker' },
								{ '@type': 'Skill', name: 'Git' },
								{
									'@type': 'Skill',
									name: 'GitHub',
									alternateName: 'GitHub Actions',
								},
								{
									'@type': 'Skill',
									name: 'Cloudflare',
									alternateName: 'Cloudflare Workers',
								},
								{ '@type': 'Skill', name: 'Cloudflare Pages' },
								{ '@type': 'Skill', name: 'WordPress' },
								{
									'@type': 'Skill',
									name: 'Shopify',
									alternateName: 'Shopify API',
								},
								{
									'@type': 'Skill',
									name: 'Liquid',
									alternateName: 'Liquid Template Language',
								},
								{
									'@type': 'Skill',
									name: 'Selenium',
									alternateName: 'Selenium WebDriver',
								},
								{
									'@type': 'Skill',
									name: 'REST API',
									alternateName: 'RESTful API',
								},
								{ '@type': 'Skill', name: 'UI/UX Development' },
								{
									'@type': 'Skill',
									name: 'Linux',
									alternateName:
										'Arch Linux, Ubuntu, Manjaro',
								},
								{
									'@type': 'Skill',
									name: 'MacOS',
									alternateName: 'macOS',
								},
								{
									'@type': 'Skill',
									name: 'Windows',
									alternateName: 'Windows 10, Windows 11',
								},
								{
									'@type': 'Skill',
									name: 'Android',
									alternateName: 'Android OS',
								},
								{
									'@type': 'Skill',
									name: 'iOS',
									alternateName: 'iOS OS',
								},
								{
									'@type': 'Skill',
									name: 'xCode',
									alternateName: 'xCode IDE',
								},
								{
									'@type': 'Skill',
									name: 'VSCode',
									alternateName: 'Visual Studio Code',
								},
								{
									'@type': 'Skill',
									name: 'Teamwork',
									alternateName:
										'Communication, Leadership, Collaboration',
								},
								{
									'@type': 'Skill',
									name: 'Problem Solving',
									alternateName:
										'Problem Solving, Critical Thinking',
								},
								{
									'@type': 'Skill',
									name: 'Adaptability',
									alternateName: 'Adaptability, Flexibility',
								},
								{
									'@type': 'Skill',
									name: 'Time Management',
									alternateName:
										'Time Management, Prioritization',
								},
								{
									'@type': 'Skill',
									name: 'Agile Development',
									alternateName: 'Agile Methodologies, Scrum',
								},
							],
							alumniOf: {
								'@type': 'EducationalOrganization',
								name: 'University of Kansas',
								startDate: '2019',
								endDate: '2023',
							},
						}),
					}}
				/>
			</head>
			<body>
				<Providers>
					<LoadingHandler>{children}</LoadingHandler>
				</Providers>
			</body>
		</html>
	);
}
