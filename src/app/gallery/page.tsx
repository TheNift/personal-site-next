"use client";
import { useState, useEffect } from 'react';
import GalleryView from '@views/GalleryView';
import PageComponent from '@components/Page';

export default function Page() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	if (!isMobile) return null;

	return (
		<PageComponent className="bg-[rgba(0,0,0,0.92)] pointer-events-auto">
			<GalleryView />
		</PageComponent>
	);
}
