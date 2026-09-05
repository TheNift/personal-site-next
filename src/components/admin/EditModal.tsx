'use client';

import React, { useState, useEffect } from 'react';
import type { GalleryImage } from '@/types/gallery';
import { Edit3, X, AlertCircle, Save } from 'lucide-react';

interface EditModalProps {
	image: GalleryImage | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (updatedImage: GalleryImage) => void;
}

export default function EditModal({ image, isOpen, onClose, onSuccess }: EditModalProps) {
	const [cameraName, setCameraName] = useState('');
	const [location, setLocation] = useState('');
	const [date, setDate] = useState('');
	const [focalLength, setFocalLength] = useState('');
	const [aperture, setAperture] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (image) {
			// Re-seed the form fields whenever a different image is opened.
			/* eslint-disable react-hooks/set-state-in-effect */
			setCameraName(image.camera_name || '');
			setLocation(image.location || '');
			setDate(image.date || '');
			setFocalLength(image.focal_length || '');
			setAperture(image.aperture || '');
			setTitle(image.title || '');
			setDescription(image.description || '');
			setError(null);
			/* eslint-enable react-hooks/set-state-in-effect */
		}
	}, [image]);

	if (!isOpen || !image) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const res = await fetch(`/api/admin/gallery/${encodeURIComponent(image.key)}/metadata`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					camera_name: cameraName.trim(),
					location: location.trim(),
					date: date.trim(),
					focal_length: focalLength.trim(),
					aperture: aperture.trim(),
					title: title.trim(),
					description: description.trim(),
				}),
			});

			const data = (await res.json()) as { success?: boolean; image?: GalleryImage; error?: string };

			if (res.ok && data.success && data.image) {
				onSuccess(data.image);
				onClose();
			} else {
				setError(data.error || 'Failed to update metadata');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error while updating metadata');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='admin-modal-backdrop' onClick={onClose}>
			<div
				className='admin-modal'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between pb-4 mb-4 border-b border-yorha/15'>
					<h2 className='text-base font-bold uppercase tracking-wider text-yorha m-0 flex items-center gap-2'>
						<Edit3 size={18} />
						Edit Metadata: {image.key}
					</h2>
					<button
						onClick={onClose}
						className='text-yorha/50 hover:text-yorha p-1 cursor-pointer transition-colors'
						aria-label='Close'
					>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Image preview badge */}
					<div className='flex items-center gap-3 p-2.5 bg-black/30 rounded border border-yorha/10'>
						<img
							src={`/api/gallery/thumbnail/${encodeURIComponent(image.key)}`}
							alt={image.key}
							className='w-16 h-12 object-cover rounded border border-yorha/20'
						/>
						<div className='overflow-hidden'>
							<p className='text-xs font-mono text-yorha truncate m-0 font-bold'>
								{image.key}
							</p>
							<p className='text-[11px] font-mono text-yorha/50 m-0 mt-0.5'>
								{(image.size / (1024 * 1024)).toFixed(2)} MB {image.resolution ? `• ${image.resolution}` : ''}
							</p>
						</div>
					</div>

					{/* Metadata fields */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 pt-2'>
						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Camera Name
							</label>
							<input
								type='text'
								value={cameraName}
								onChange={(e) => setCameraName(e.target.value)}
								placeholder='e.g. Sony A7 IV'
								className='admin-input text-xs'
								disabled={saving}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Location
							</label>
							<input
								type='text'
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder='e.g. Tokyo, Japan'
								className='admin-input text-xs'
								disabled={saving}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Date (YYYY-MM-DD)
							</label>
							<input
								type='date'
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className='admin-input text-xs'
								disabled={saving}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Focal Length
							</label>
							<input
								type='text'
								value={focalLength}
								onChange={(e) => setFocalLength(e.target.value)}
								placeholder='e.g. 35mm'
								className='admin-input text-xs'
								disabled={saving}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Aperture
							</label>
							<input
								type='text'
								value={aperture}
								onChange={(e) => setAperture(e.target.value)}
								placeholder='e.g. f/1.8'
								className='admin-input text-xs'
								disabled={saving}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Resolution (Auto)
							</label>
							<input
								type='text'
								value={image.resolution || 'Auto-detected on upload'}
								disabled
								className='admin-input text-xs opacity-60 cursor-not-allowed'
							/>
						</div>
					</div>

					<div className='pt-1'>
						<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
							Title (Optional)
						</label>
						<input
							type='text'
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='e.g. Neon Horizon'
							className='admin-input text-xs'
							disabled={saving}
						/>
					</div>

					<div>
						<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
							Description (Optional)
						</label>
						<textarea
							rows={2}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder='Optional description...'
							className='admin-input text-xs resize-none'
							disabled={saving}
						/>
					</div>

					{error && (
						<div className='flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-xs'>
							<AlertCircle size={15} className='shrink-0' />
							<span>{error}</span>
						</div>
					)}

					<div className='flex items-center justify-end gap-3 pt-4 border-t border-yorha/15'>
						<button
							type='button'
							onClick={onClose}
							disabled={saving}
							className='admin-btn admin-btn-secondary'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={saving}
							className='admin-btn'
						>
							{saving ? (
								<>
									<div className='w-4 h-4 border-2 border-yorha-dark/40 border-t-yorha-dark rounded-full animate-spin' />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Save size={15} />
									<span>Save Changes</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
