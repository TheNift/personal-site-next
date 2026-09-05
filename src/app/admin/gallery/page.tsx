'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type { GalleryImage } from '@/types/gallery';
import UploadModal from '@/components/admin/UploadModal';
import EditModal from '@/components/admin/EditModal';
import {
	Plus,
	RefreshCw,
	Edit3,
	Trash2,
	Camera,
	MapPin,
	Calendar,
	Sliders,
	Maximize2,
	AlertTriangle,
	Search,
} from 'lucide-react';

export default function AdminGalleryPage() {
	const { isAuthenticated, isLoading } = useAdminAuth();
	const router = useRouter();

	const [images, setImages] = useState<GalleryImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
	const [deletingImage, setDeletingImage] = useState<GalleryImage | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Auth protection
	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.replace('/admin/login');
		}
	}, [isAuthenticated, isLoading, router]);

	const fetchGallery = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/admin/gallery');
			if (!res.ok) {
				if (res.status === 401) {
					router.replace('/admin/login');
					return;
				}
				throw new Error('Failed to fetch gallery images');
			}
			const data = (await res.json()) as GalleryImage[];
			setImages(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error loading gallery');
		} finally {
			setLoading(false);
		}
	}, [router]);

	useEffect(() => {
		if (isAuthenticated) {
			// fetchGallery() sets loading/error state synchronously; that is the
			// intended behaviour for a one-shot data fetch, not a derived-state cascade.
			// eslint-disable-next-line react-hooks/set-state-in-effect
			fetchGallery();
		}
	}, [isAuthenticated, fetchGallery]);

	const handleUploadSuccess = (_newImage: GalleryImage) => {
		fetchGallery();
	};

	const handleEditSuccess = (updatedImage: GalleryImage) => {
		setImages((prev) =>
			prev.map((img) => (img.key === updatedImage.key ? updatedImage : img))
		);
	};

	const handleDeleteConfirm = async () => {
		if (!deletingImage) return;
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/gallery/${encodeURIComponent(deletingImage.key)}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setImages((prev) => prev.filter((img) => img.key !== deletingImage.key));
				setDeletingImage(null);
			} else {
				const data = (await res.json()) as { error?: string };
				alert(data.error || 'Failed to delete image');
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Network error while deleting image');
		} finally {
			setIsDeleting(false);
		}
	};

	// Filter images based on search
	const filteredImages = images.filter((img) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			img.key.toLowerCase().includes(q) ||
			(img.camera_name && img.camera_name.toLowerCase().includes(q)) ||
			(img.location && img.location.toLowerCase().includes(q)) ||
			(img.title && img.title.toLowerCase().includes(q)) ||
			(img.date && img.date.includes(q))
		);
	});

	const totalSizeMB = (
		images.reduce((acc, img) => acc + (img.size || 0), 0) /
		(1024 * 1024)
	).toFixed(1);

	if (isLoading || !isAuthenticated) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='w-8 h-8 border-2 border-yorha/20 border-t-yorha rounded-full animate-spin' />
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-yorha/15'>
				<div>
					<h1 className='text-xl font-bold uppercase tracking-wider text-yorha m-0'>
						Gallery Manager
					</h1>
					<p className='text-xs text-yorha/60 mt-1 m-0'>
						Manage photo bucket assets, upload new photos, and edit camera metadata.
					</p>
				</div>

				<div className='flex items-center gap-3'>
					<button
						onClick={() => fetchGallery()}
						disabled={loading}
						className='admin-btn admin-btn-secondary'
						title='Refresh photo list'
					>
						<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
						<span className='hidden sm:inline'>Refresh</span>
					</button>

					<button
						onClick={() => setIsUploadOpen(true)}
						className='admin-btn'
					>
						<Plus size={16} />
						<span>Upload Photo</span>
					</button>
				</div>
			</div>

			{/* Stats & Search Bar */}
			<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
				<div className='flex items-center gap-4 text-xs font-mono text-yorha/70'>
					<span className='bg-yorha/10 px-2.5 py-1 rounded border border-yorha/15'>
						Total: <strong className='text-yorha font-bold'>{images.length}</strong> photos
					</span>
					<span className='bg-yorha/10 px-2.5 py-1 rounded border border-yorha/15'>
						Bucket Size: <strong className='text-yorha font-bold'>{totalSizeMB}</strong> MB
					</span>
				</div>

				<div className='relative max-w-xs w-full'>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Filter by camera, location, name...'
						className='admin-input pl-8 text-xs py-1.5'
					/>
					<Search size={14} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-yorha/40' />
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<div className='p-3 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-xs flex items-center gap-2'>
					<AlertTriangle size={16} />
					<span>{error}</span>
				</div>
			)}

			{/* Loading State */}
			{loading && images.length === 0 && (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className='admin-card animate-pulse h-64 bg-yorha/5 border-yorha/10'
						/>
					))}
				</div>
			)}

			{/* Empty State */}
			{!loading && images.length === 0 && !error && (
				<div className='admin-card text-center py-16 flex flex-col items-center justify-center'>
					<div className='p-4 bg-yorha/10 rounded-full text-yorha/60 mb-3'>
						<Camera size={36} />
					</div>
					<h3 className='text-sm font-bold uppercase tracking-wider text-yorha'>
						No photos in gallery bucket
					</h3>
					<p className='text-xs text-yorha/50 max-w-sm mt-1 mb-4'>
						Upload your first photo to start building your gallery with camera & location metadata.
					</p>
					<button
						onClick={() => setIsUploadOpen(true)}
						className='admin-btn'
					>
						<Plus size={16} />
						<span>Upload First Photo</span>
					</button>
				</div>
			)}

			{/* Gallery Image Grid */}
			{!loading && filteredImages.length > 0 && (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{filteredImages.map((image) => (
						<div
							key={image.key}
							className='admin-card flex flex-col justify-between overflow-hidden group hover:border-yorha/30 transition-all p-3.5'
						>
							{/* Image preview */}
							<div className='relative aspect-3/2 bg-black/40 rounded overflow-hidden mb-3 border border-yorha/10'>
								<img
									src={`/api/gallery/thumbnail/${encodeURIComponent(image.key)}`}
									alt={image.title || image.key}
									className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
									loading='lazy'
								/>
								<div className='absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-[10px] text-yorha/80 px-2 py-0.5 rounded font-mono border border-white/10'>
									{(image.size / (1024 * 1024)).toFixed(2)} MB
								</div>
								{image.title && (
									<div className='absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6'>
										<span className='text-xs font-bold text-white truncate block'>
											{image.title}
										</span>
									</div>
								)}
							</div>

							{/* Key name */}
							<div className='mb-2.5'>
								<p className='text-xs font-mono text-yorha font-bold truncate m-0' title={image.key}>
									{image.key}
								</p>
							</div>

							{/* Metadata Badges */}
							<div className='space-y-1.5 text-[11px] font-mono text-yorha/75 flex-1'>
								{image.camera_name && (
									<div className='flex items-center gap-1.5 truncate'>
										<Camera size={12} className='text-yorha/50 shrink-0' />
										<span className='truncate'>{image.camera_name}</span>
									</div>
								)}
								{image.location && (
									<div className='flex items-center gap-1.5 truncate'>
										<MapPin size={12} className='text-yorha/50 shrink-0' />
										<span className='truncate'>{image.location}</span>
									</div>
								)}
								{image.date && (
									<div className='flex items-center gap-1.5 truncate'>
										<Calendar size={12} className='text-yorha/50 shrink-0' />
										<span>{image.date}</span>
									</div>
								)}
								{(image.focal_length || image.aperture) && (
									<div className='flex items-center gap-1.5 truncate'>
										<Sliders size={12} className='text-yorha/50 shrink-0' />
										<span>
											{[image.focal_length, image.aperture].filter(Boolean).join(' • ')}
										</span>
									</div>
								)}
								{image.resolution && (
									<div className='flex items-center gap-1.5 truncate'>
										<Maximize2 size={12} className='text-yorha/50 shrink-0' />
										<span>{image.resolution}</span>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className='flex items-center justify-end gap-2 pt-3 mt-3 border-t border-yorha/10'>
								<button
									onClick={() => setEditingImage(image)}
									className='admin-btn admin-btn-secondary py-1 px-2.5 text-xs'
									title='Edit photo metadata'
								>
									<Edit3 size={13} />
									<span>Edit</span>
								</button>
								<button
									onClick={() => setDeletingImage(image)}
									className='admin-btn admin-btn-danger py-1 px-2.5 text-xs'
									title='Delete photo from bucket'
								>
									<Trash2 size={13} />
									<span>Delete</span>
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Upload Modal */}
			<UploadModal
				isOpen={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				onSuccess={handleUploadSuccess}
			/>

			{/* Edit Modal */}
			<EditModal
				image={editingImage}
				isOpen={!!editingImage}
				onClose={() => setEditingImage(null)}
				onSuccess={handleEditSuccess}
			/>

			{/* Delete Confirmation Modal */}
			{deletingImage && (
				<div
					className='admin-modal-backdrop'
					onClick={() => setDeletingImage(null)}
				>
					<div
						className='admin-modal max-w-sm'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='flex items-center gap-3 text-red-400 mb-3'>
							<AlertTriangle size={24} />
							<h3 className='text-sm font-bold uppercase tracking-wider text-yorha m-0'>
								Delete Photo?
							</h3>
						</div>
						<p className='text-xs text-yorha/70 mb-4 leading-relaxed'>
							Are you sure you want to permanently delete{' '}
							<strong className='text-yorha font-mono'>{deletingImage.key}</strong> and its thumbnail from R2? This action cannot be undone.
						</p>
						<div className='flex items-center justify-end gap-3 pt-3 border-t border-yorha/15'>
							<button
								onClick={() => setDeletingImage(null)}
								disabled={isDeleting}
								className='admin-btn admin-btn-secondary text-xs'
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={isDeleting}
								className='admin-btn admin-btn-danger text-xs'
							>
								{isDeleting ? 'Deleting...' : 'Confirm Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
