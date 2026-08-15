'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GameConfirmationModal from '@/components/GameConfirmationModal';

export default function GamePage() {
	const { strings } = useLanguage();
	const router = useRouter();
	const homeText = strings.ui.nav.find((n) => n.to === '/')?.text || 'Home';
	const [gameVersion, setGameVersion] = useState<string | null>(null);
	const [hasEntered, setHasEntered] = useState(false);

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

	return (
		<div className="w-full h-full relative bg-[#0d0c09] overflow-hidden select-none">
			{/* Top-left navigation back button */}
			<Link
				href="/"
				className="absolute top-4 left-4 z-50 text-white/60 hover:text-white transition-colors bg-black/60 hover:bg-black/80 px-4 py-2 rounded-lg font-mono text-xs backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-lg"
			>
				&larr; <span>{homeText}</span>
			</Link>

			{/* Confirmation modal before entering the game */}
			<GameConfirmationModal
				isOpen={!hasEntered}
				onConfirm={() => setHasEntered(true)}
				onCancel={() => router.push('/')}
			/>

			{/* Game iframe only loads once confirmed */}
			{hasEntered ? (
				<iframe
					src={iframeSrc}
					className="w-full h-full border-none outline-none block"
					allowFullScreen
					allow="autoplay; fullscreen; xr-spatial-tracking"
				/>
			) : (
				<div className="w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d1b14] via-[#11100b] to-[#080705]">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#d1cdb708_1px,transparent_1px),linear-gradient(to_bottom,#d1cdb708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
				</div>
			)}
		</div>
	);
}


