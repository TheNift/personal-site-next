'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { GalleryImage } from '@/types/gallery';

interface GalleryLightboxProps {
	images: GalleryImage[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

function GalleryLightbox({
	images,
	currentIndex,
	onClose,
	onNavigate,
}: GalleryLightboxProps) {
	const image = images[currentIndex];
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < images.length - 1;
	const backdropRef = useRef<HTMLDivElement>(null);
	const [imageLoaded, setImageLoaded] = useState(false);

	// Reset loaded state when image changes
	useEffect(() => {
		setImageLoaded(false);
	}, [currentIndex]);

	// Preload adjacent images on mount and on index change
	useEffect(() => {
		const preload = (index: number) => {
			if (index >= 0 && index < images.length) {
				const img = new Image();
				img.src = `/api/gallery/image/${encodeURIComponent(images[index].key)}`;
			}
		};
		preload(currentIndex - 1);
		preload(currentIndex + 1);
	}, [currentIndex, images]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			} else if (e.key === 'ArrowLeft' && hasPrev) {
				onNavigate(currentIndex - 1);
			} else if (e.key === 'ArrowRight' && hasNext) {
				onNavigate(currentIndex + 1);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

	// Click outside to close
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === backdropRef.current) {
				onClose();
			}
		},
		[onClose],
	);

	// Preload on hover of nav arrows
	const handlePrevHover = useCallback(() => {
		if (currentIndex > 1) {
			const img = new Image();
			img.src = `/api/gallery/image/${encodeURIComponent(images[currentIndex - 2].key)}`;
		}
	}, [currentIndex, images]);

	const handleNextHover = useCallback(() => {
		if (currentIndex < images.length - 2) {
			const img = new Image();
			img.src = `/api/gallery/image/${encodeURIComponent(images[currentIndex + 2].key)}`;
		}
	}, [currentIndex, images]);

	const formattedDate = image.date
		? new Date(image.date).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: null;

	return (
		<motion.div
			ref={backdropRef}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.25 }}
			className='lightbox-backdrop'
			onClick={handleBackdropClick}
		>
			{/* Close button */}
			<button
				className='lightbox-close'
				onClick={onClose}
				aria-label='Close gallery'
			>
				✕
			</button>

			{/* Image counter */}
			<div className='lightbox-counter'>
				{currentIndex + 1} / {images.length}
			</div>

			{/* Navigation arrows */}
			{hasPrev && (
				<button
					className='lightbox-nav lightbox-nav-prev'
					onClick={() => onNavigate(currentIndex - 1)}
					onMouseEnter={handlePrevHover}
					aria-label='Previous image'
				>
					<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<polyline points='15 18 9 12 15 6' />
					</svg>
				</button>
			)}
			{hasNext && (
				<button
					className='lightbox-nav lightbox-nav-next'
					onClick={() => onNavigate(currentIndex + 1)}
					onMouseEnter={handleNextHover}
					aria-label='Next image'
				>
					<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<polyline points='9 18 15 12 9 6' />
					</svg>
				</button>
			)}

			{/* White framed image card */}
			<motion.div
				key={currentIndex}
				initial={{ opacity: 0, scale: 0.96 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.96 }}
				transition={{ duration: 0.2 }}
				className='lightbox-frame'
			>
				{/* Image container */}
				<div className='lightbox-image-container'>
					{!imageLoaded && (
						<div className='lightbox-image-skeleton' />
					)}
					<img
						src={`/api/gallery/image/${encodeURIComponent(image.key)}`}
						alt={image.title || image.key}
						className='lightbox-image'
						style={{ opacity: imageLoaded ? 1 : 0 }}
						onLoad={() => setImageLoaded(true)}
						draggable={false}
					/>
				</div>

				{/* Metadata below the photo on the white framing */}
				{(image.title || image.description || formattedDate) && (
					<div className='lightbox-meta'>
						{image.title && (
							<h2 className='lightbox-meta-title'>{image.title}</h2>
						)}
						{formattedDate && (
							<p className='lightbox-meta-date'>{formattedDate}</p>
						)}
						{image.description && (
							<p className='lightbox-meta-description'>
								{image.description}
							</p>
						)}
					</div>
				)}
			</motion.div>
		</motion.div>
	);
}

export default GalleryLightbox;
