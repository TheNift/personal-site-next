'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Page from '@components/Page';
import GalleryLightbox from '@components/GalleryLightbox';
import type { GalleryImage } from '@/types/gallery';

function GalleryView() {
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
				setImages(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	const handleThumbnailHover = useCallback((key: string) => {
		// Preload full-quality image on hover
		const img = new window.Image();
		img.src = `/api/gallery/image/${encodeURIComponent(key)}`;
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

	const allImagesLoaded = images.length > 0 && loadedImageKeys.size === images.length;

	return (
		<Page className='relative flex flex-col items-center justify-start pointer-events-auto overflow-hidden'>
			<div className='w-full h-full flex flex-col items-center pt-[32px] md:pt-[24px] overflow-y-auto hidden-scrollbar'>
				{/* Header */}
				<motion.h1
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className='text-yorha/80 text-sm tracking-[0.3em] uppercase font-light mb-6 font-jetbrains-mono'
				>
					Gallery
				</motion.h1>

				{/* Loading skeleton */}
				{(loading || (!allImagesLoaded && images.length > 0)) && (
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
						className={`gallery-grid w-full lg:px-[300px] px-4 md:px-8 pb-8 ${allImagesLoaded ? '' : 'absolute opacity-0 pointer-events-none'}`}
						variants={{
							hidden: {},
							visible: {
								transition: { staggerChildren: 0.05 }
							}
						}}
						initial='hidden'
						animate={allImagesLoaded ? 'visible' : 'hidden'}
					>
						{images.map((image) => (
							<motion.button
								key={image.key}
								variants={{
									hidden: { opacity: 0, scale: 0.95 },
									visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
								}}
								className='gallery-thumbnail'
								onClick={() => handleOpenLightbox(images.indexOf(image))}
								onMouseEnter={() => handleThumbnailHover(image.key)}
								aria-label={image.title || image.key}
							>
								<Image
									src={`/api/gallery/image/${encodeURIComponent(image.key)}`}
									alt={image.title || image.key}
									width={720}
									height={480}
									quality={80}
									className='gallery-thumbnail-img'
									onLoad={() => handleImageLoad(image.key)}
									onError={() => handleImageLoad(image.key)}
									loading='eager'
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
