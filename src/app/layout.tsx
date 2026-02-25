import type { Metadata } from 'next';
import { Providers } from './providers';
import LoadingHandler from '@/components/LoadingHandler';
import '@/assets/index.css';

export const metadata: Metadata = {
	title: 'My Portfolio',
	description: 'Personal portfolio website',
	icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
			</head>
			<body className="antialiased">
				<Providers>
					<LoadingHandler>
						{children}
					</LoadingHandler>
				</Providers>
			</body>
		</html>
	);
}