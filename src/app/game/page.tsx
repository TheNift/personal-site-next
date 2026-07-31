'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function GamePage() {
	const { strings } = useLanguage();
	const homeText = strings.ui.nav.find(n => n.to === '/')?.text || 'Home';

	return (
		<div className="w-full h-full relative bg-black">
			<Link
				href="/"
				className="absolute top-4 left-4 z-50 text-white/50 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded font-mono text-sm backdrop-blur-sm"
			>
				&larr; {homeText}
			</Link>
			
			<iframe
				src="/game/mmo.html"
				className="w-full h-full border-none outline-none block"
				allowFullScreen
				allow="autoplay; fullscreen; xr-spatial-tracking"
			/>
		</div>
	);
}
