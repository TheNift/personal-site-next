'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function GamePage() {
	const { strings } = useLanguage();
	const homeText = strings.ui.nav.find(n => n.to === '/')?.text || 'Home';
	const [gameVersion, setGameVersion] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		async function checkVersion() {
			try {
				const res = await fetch('/game/version.json', { cache: 'no-store' });
				if (!res.ok) return;

				const text = await res.text();
				let ver = text.trim();
				try {
					const parsed = JSON.parse(text);
					ver = typeof parsed === 'object' && parsed !== null
						? String(parsed.version || parsed.hash || parsed.v || JSON.stringify(parsed))
						: String(parsed);
				} catch {
					// Raw text string
				}

				if (!ver) return;

				const storedVersion = localStorage.getItem('game_version');
				if (storedVersion !== ver) {
					if (typeof window !== 'undefined' && 'caches' in window) {
						try {
							const cacheNames = await caches.keys();
							await Promise.all(cacheNames.map(name => caches.delete(name)));
						} catch (err) {
							console.warn('[Game] Failed to clear Cache Storage:', err);
						}
					}
					localStorage.setItem('game_version', ver);
				}

				if (isMounted) {
					setGameVersion(ver);
				}
			} catch (err) {
				console.warn('[Game] Unable to fetch version.json:', err);
			}
		}

		checkVersion();
		return () => {
			isMounted = false;
		};
	}, []);

	const iframeSrc = gameVersion ? `/game/mmo.html?v=${encodeURIComponent(gameVersion)}` : '/game/mmo.html';

	return (
		<div className="w-full h-full relative bg-black">
			<Link
				href="/"
				className="absolute top-4 left-4 z-50 text-white/50 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded font-mono text-sm backdrop-blur-sm"
			>
				&larr; {homeText}
			</Link>
			
			<iframe
				src={iframeSrc}
				className="w-full h-full border-none outline-none block"
				allowFullScreen
				allow="autoplay; fullscreen; xr-spatial-tracking"
			/>
		</div>
	);
}

