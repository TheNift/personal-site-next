'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
		? (() => {
				try {
					if (image.date.includes('-')) {
						const parts = image.date.split('-');
						if (parts.length === 3) {
							const year = parseInt(parts[0], 10);
							const month = parseInt(parts[1], 10) - 1;
							const day = parseInt(parts[2], 10);
							const d = new Date(year, month, day);
							if (!isNaN(d.getTime())) {
								return d.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								});
							}
						}
					}
					const d = new Date(image.date);
					return !isNaN(d.getTime())
						? d.toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
						  })
						: image.date;
				} catch {
					return image.date;
				}
		  })()
		: null;

	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return createPortal(
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
				<div className='lightbox-image-container min-w-[200px]'>
					<AnimatePresence>
						{!imageLoaded && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className='absolute inset-0 flex items-center justify-center pointer-events-none'
							>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
									className='w-10 h-10 border-[3px] border-black/10 border-t-black/60 rounded-full'
								/>
							</motion.div>
						)}
					</AnimatePresence>
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
				{(image.title || image.description || image.camera_name || image.location || image.date || image.focal_length || image.aperture || image.resolution) && (
					<div className='lightbox-meta'>
						{image.title && (
							<h2 className='lightbox-meta-title'>{image.title}</h2>
						)}
						{image.description && (
							<p className='lightbox-meta-description'>
								{image.description}
							</p>
						)}
						<div className='lightbox-meta-fields'>
							{image.camera_name && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Camera</span>
									<span className='lightbox-meta-field-value'>{image.camera_name}</span>
								</div>
							)}
							{image.location && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Location</span>
									<span className='lightbox-meta-field-value'>{image.location}</span>
								</div>
							)}
							{image.date && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Date</span>
									<span className='lightbox-meta-field-value'>{formattedDate || image.date}</span>
								</div>
							)}
							{image.focal_length && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Focal Length</span>
									<span className='lightbox-meta-field-value'>{image.focal_length}</span>
								</div>
							)}
							{image.aperture && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Aperture</span>
									<span className='lightbox-meta-field-value'>{image.aperture}</span>
								</div>
							)}
							{image.resolution && (
								<div className='lightbox-meta-field'>
									<span className='lightbox-meta-field-label'>Resolution</span>
									<span className='lightbox-meta-field-value'>{image.resolution}</span>
								</div>
							)}
						</div>
					</div>
				)}
			</motion.div>
		</motion.div>,
		document.body
	);

}

export default GalleryLightbox;
