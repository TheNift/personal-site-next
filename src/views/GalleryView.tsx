'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Page from '@components/Page';
import GalleryLightbox from '@components/GalleryLightbox';
import type { GalleryImage } from '@/types/gallery';
import { preload } from 'react-dom';

const thumbnailUrl = (key: string) =>
	`/api/gallery/thumbnail/${encodeURIComponent(key)}`;
const fullUrl = (key: string) =>
	`/api/gallery/image/${encodeURIComponent(key)}`;

function GalleryView() {
	preload('/api/gallery', { as: 'fetch', crossOrigin: 'anonymous' });
	
	const [images, setImages] = useState<GalleryImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [loadedImageKeys, setLoadedImageKeys] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetch('/api/gallery')
			.then((res) => {
				if (!res.ok) throw new Error('Failed to load gallery');
				return res.json() as Promise<GalleryImage[]>;
			})
			.then((data) => {
				if (data.length > 0) {
					const firstImgUrl = thumbnailUrl(data[0].key);
					const preloadLink = document.createElement('link');
					preloadLink.rel = 'preload';
					preloadLink.as = 'image';
					preloadLink.href = firstImgUrl;
					preloadLink.fetchPriority = 'high';
					document.head.appendChild(preloadLink);
				}
				setImages(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	const handleThumbnailHover = useCallback((key: string) => {
		const img = new window.Image();
		img.src = fullUrl(key);
	}, []);

	const handleOpenLightbox = useCallback((index: number) => {
		setLightboxIndex(index);
	}, []);

	const handleCloseLightbox = useCallback(() => {
		setLightboxIndex(null);
	}, []);

	const handleNavigateLightbox = useCallback((index: number) => {
		setLightboxIndex(index);
	}, []);

	const handleImageLoad = useCallback((key: string) => {
		setLoadedImageKeys((prev) => {
			const next = new Set(prev);
			next.add(key);
			return next;
		});
	}, []);

	const INITIAL_LOAD_COUNT = Math.min(images.length, 8);
	const initialImagesLoaded = images.length > 0 && 
		images.slice(0, INITIAL_LOAD_COUNT).every(img => loadedImageKeys.has(img.key));

	return (
		<Page className='relative flex flex-col items-center justify-start pointer-events-auto overflow-hidden'>
			<div className='w-full h-full flex flex-col items-center pt-0 md:pt-[24px] overflow-y-auto hidden-scrollbar'>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className='sticky md:static top-0 z-20 w-full flex items-center justify-center py-5 md:pt-0 md:pb-6 bg-black/60 md:bg-transparent backdrop-blur-md md:backdrop-blur-none mb-2 md:mb-0'
				>
					<h1 className='text-yorha/80 text-sm tracking-[0.3em] uppercase font-light font-jetbrains-mono m-0'>
						Gallery
					</h1>
				</motion.div>

				{/* Loading skeleton */}
				{(loading || (!initialImagesLoaded && images.length > 0)) && (
					<div className='gallery-grid w-full max-w-[1400px] px-4 md:px-8'>
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className='gallery-skeleton'
								style={{ animationDelay: `${i * 0.1}s` }}
							/>
						))}
					</div>
				)}

				{/* Error */}
				{error && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='text-yorha/60 text-sm mt-8'
					>
						{error}
					</motion.p>
				)}

				{/* Empty state */}
				{!loading && !error && images.length === 0 && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='text-yorha/60 text-sm mt-8'
					>
						No photos yet — check back soon.
					</motion.p>
				)}

				{/* Image grid */}
				{!loading && images.length > 0 && (
					<motion.div
						className={`gallery-grid w-full lg:px-[200px] px-4 md:px-8 pb-8 ${initialImagesLoaded ? '' : 'absolute opacity-0 pointer-events-none'}`}
						variants={{
							hidden: {},
							visible: {
								transition: { staggerChildren: 0.1 }
							}
						}}
						initial='hidden'
						animate={initialImagesLoaded ? 'visible' : 'hidden'}
					>
						{images.map((image, index) => (
							<motion.button
								key={image.key}
								variants={{
									hidden: { opacity: 0, scale: 0.95 },
									visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
								}}
								className='gallery-thumbnail'
								onClick={() => handleOpenLightbox(index)}
								onMouseEnter={() => handleThumbnailHover(image.key)}
								aria-label={image.title || image.key}
							>
								<img
									src={thumbnailUrl(image.key)}
									alt={image.title || image.key}
									className='gallery-thumbnail-img'
									onLoad={() => handleImageLoad(image.key)}
									onError={() => handleImageLoad(image.key)}
									loading={index < 8 ? 'eager' : 'lazy'}
									fetchPriority={index === 0 ? 'high' : 'auto'}
									draggable={false}
								/>
								{image.title && (
									<div className='gallery-thumbnail-overlay'>
										<span className='gallery-thumbnail-title'>
											{image.title}
										</span>
									</div>
								)}
							</motion.button>
						))}
					</motion.div>
				)}
			</div>

			{/* Lightbox */}
			<AnimatePresence>
				{lightboxIndex !== null && (
					<GalleryLightbox
						images={images}
						currentIndex={lightboxIndex}
						onClose={handleCloseLightbox}
						onNavigate={handleNavigateLightbox}
					/>
				)}
			</AnimatePresence>
		</Page>
	);
}

export default GalleryView;
