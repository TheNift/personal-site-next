'use client';

import { useEffect, useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { GalleryImage } from '@/types/gallery';

interface GalleryLightboxProps {
	images: GalleryImage[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

const emptySubscribe = () => () => {};

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
	const [prevIndex, setPrevIndex] = useState(currentIndex);

	// Reset loaded state when image index changes during render
	if (prevIndex !== currentIndex) {
		setPrevIndex(currentIndex);
		setImageLoaded(false);
	}

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

	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false
	);

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
				<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
					<line x1='18' y1='6' x2='6' y2='18' />
					<line x1='6' y1='6' x2='18' y2='18' />
				</svg>
			</button>

			{/* Image counter */}
			<div className='lightbox-counter'>
				<span>{currentIndex + 1}</span>
				<span className='lightbox-counter-divider'>/</span>
				<span>{images.length}</span>
			</div>

			{/* Navigation arrows */}
			{hasPrev && (
				<button
					className='lightbox-nav lightbox-nav-prev'
					onClick={(e) => {
						e.stopPropagation();
						onNavigate(currentIndex - 1);
					}}
					onMouseEnter={handlePrevHover}
					aria-label='Previous image'
				>
					<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<polyline points='15 18 9 12 15 6' />
					</svg>
				</button>
			)}
			{hasNext && (
				<button
					className='lightbox-nav lightbox-nav-next'
					onClick={(e) => {
						e.stopPropagation();
						onNavigate(currentIndex + 1);
					}}
					onMouseEnter={handleNextHover}
					aria-label='Next image'
				>
					<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<polyline points='9 18 15 12 9 6' />
					</svg>
				</button>
			)}

			{/* White framed image card (The Print) */}
			<motion.div
				key={currentIndex}
				initial={{ opacity: 0, scale: 0.97, y: 6 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.97, y: 6 }}
				transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
				className={`lightbox-frame ${formattedDate ? 'has-header' : ''}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Top-right date on the print */}
				{formattedDate && (
					<div className='lightbox-frame-header'>
						<span className='lightbox-print-date'>{formattedDate}</span>
					</div>
				)}

				{/* Image container */}
				<div className='lightbox-image-container'>
					<AnimatePresence>
						{!imageLoaded && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className='lightbox-image-loader'
							>
								<div className='lightbox-spinner' />
							</motion.div>
						)}
					</AnimatePresence>
					<img
						src={`/api/gallery/image/${encodeURIComponent(image.key)}`}
						alt={image.title || image.key}
						className={`lightbox-image ${imageLoaded ? 'is-loaded' : 'is-loading'}`}
						onLoad={() => setImageLoaded(true)}
						draggable={false}
					/>
				</div>

				{/* Metadata below the photo on the print */}
				{(image.title || image.description || image.camera_name || image.location || image.focal_length || image.aperture || image.resolution) && (
					<div className='lightbox-meta'>
						<div className='lightbox-meta-layout'>
							{/* Left tight column */}
							<div className='lightbox-meta-left'>
								{image.title && (
									<h2 className='lightbox-meta-title'>{image.title}</h2>
								)}
								{image.description && (
									<p className='lightbox-meta-description'>
										{image.description}
									</p>
								)}
								<div className='lightbox-meta-details'>
									{image.camera_name && (
										<div className='lightbox-meta-camera'>
											{image.camera_name}
										</div>
									)}
									{image.location && (
										<div className='lightbox-meta-location'>
											{image.location}
										</div>
									)}
									{(image.focal_length || image.aperture) && (
										<div className='lightbox-meta-specs'>
											{image.focal_length && <span>{image.focal_length}</span>}
											{image.focal_length && image.aperture && (
												<span className='lightbox-meta-dot'>·</span>
											)}
											{image.aperture && <span>{image.aperture}</span>}
										</div>
									)}
								</div>
							</div>

							{/* Right side: resolution at the top of under-image section */}
							{image.resolution && (
								<div className='lightbox-meta-right'>
									<span className='lightbox-meta-resolution'>
										{image.resolution}
									</span>
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
