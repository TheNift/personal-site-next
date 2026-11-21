'use client';

import { useEffect, useState } from 'react';
import { useUI } from '@/contexts/UIContext';

export default function GamePage() {
	const { isGameRunning, setGameRunning } = useUI();
	const [gameVersion, setGameVersion] = useState<string | null>(null);

	useEffect(() => {
		return () => setGameRunning(false);
	}, [setGameRunning]);

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
					ver =
						typeof parsed === 'object' && parsed !== null
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
							await Promise.all(cacheNames.map((name) => caches.delete(name)));
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

	const iframeSrc = gameVersion
		? `/game/mmo.html?v=${encodeURIComponent(gameVersion)}`
		: '/game/mmo.html';

	if (!isGameRunning) return null;

	return (
		<div className="w-full h-full relative bg-[#0d0c09] overflow-hidden select-none">
			<iframe
				src={iframeSrc}
				className="w-full h-full border-none outline-none block"
				allowFullScreen
				allow="autoplay; fullscreen; xr-spatial-tracking"
			/>
		</div>
	);
}
