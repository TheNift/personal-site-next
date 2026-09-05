'use client';

import React, { useState, useRef } from 'react';
import type { GalleryImage } from '@/types/gallery';
import { Upload, X, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { extractExifMetadata, getBrowserImageDimensions } from '@/utils/metadata';

interface UploadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (newImage: GalleryImage) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [cameraName, setCameraName] = useState('');
	const [location, setLocation] = useState('');
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [focalLength, setFocalLength] = useState('');
	const [aperture, setAperture] = useState('');
	const [resolution, setResolution] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [uploading, setUploading] = useState(false);
	const [detectingMetadata, setDetectingMetadata] = useState(false);
	const [detectedFields, setDetectedFields] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!isOpen) return null;

	const resetForm = () => {
		setFile(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		setCameraName('');
		setLocation('');
		setDate(new Date().toISOString().split('T')[0]);
		setFocalLength('');
		setAperture('');
		setResolution('');
		setTitle('');
		setDescription('');
		setError(null);
		setDetectedFields([]);
		setDetectingMetadata(false);
		setIsDragging(false);
	};

	const handleClose = () => {
		if (uploading) return;
		resetForm();
		onClose();
	};

	const processFile = async (selected: File) => {
		setFile(selected);
		setError(null);
		const url = URL.createObjectURL(selected);
		setPreviewUrl(url);

		setDetectingMetadata(true);
		setDetectedFields([]);

		const newlyDetected: string[] = [];

		try {
			// 1. Detect image dimensions
			const dims = await getBrowserImageDimensions(selected);
			if (dims) {
				const resStr = `${dims.width}x${dims.height}`;
				setResolution(resStr);
				newlyDetected.push('Resolution');
			}

			// 2. Parse EXIF metadata
			const meta = await extractExifMetadata(selected, { reverseGeocodeGps: true });

			if (meta.camera_name) {
				setCameraName(meta.camera_name);
				newlyDetected.push('Camera');
			}
			if (meta.focal_length) {
				setFocalLength(meta.focal_length);
				newlyDetected.push('Focal Length');
			}
			if (meta.aperture) {
				setAperture(meta.aperture);
				newlyDetected.push('Aperture');
			}
			if (meta.date) {
				setDate(meta.date);
				newlyDetected.push('Date');
			} else if (selected.lastModified) {
				const fileDate = new Date(selected.lastModified);
				if (!isNaN(fileDate.getTime())) {
					const y = fileDate.getFullYear();
					const m = String(fileDate.getMonth() + 1).padStart(2, '0');
					const d = String(fileDate.getDate()).padStart(2, '0');
					setDate(`${y}-${m}-${d}`);
				}
			}
			if (meta.location) {
				setLocation(meta.location);
				newlyDetected.push('Location');
			}
			if (!dims && meta.resolution) {
				setResolution(meta.resolution);
				newlyDetected.push('Resolution');
			}
		} catch (err) {
			console.warn('Metadata extraction failed:', err);
		} finally {
			setDetectingMetadata(false);
			setDetectedFields(newlyDetected);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		if (selected) {
			processFile(selected);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile && droppedFile.type.startsWith('image/')) {
			processFile(droppedFile);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			setError('Please select an image file to upload.');
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('file', file);
			if (cameraName.trim()) formData.append('camera_name', cameraName.trim());
			if (location.trim()) formData.append('location', location.trim());
			if (date.trim()) formData.append('date', date.trim());
			if (focalLength.trim()) formData.append('focal_length', focalLength.trim());
			if (aperture.trim()) formData.append('aperture', aperture.trim());
			if (resolution.trim()) formData.append('resolution', resolution.trim());
			if (title.trim()) formData.append('title', title.trim());
			if (description.trim()) formData.append('description', description.trim());

			const res = await fetch('/api/admin/gallery/upload', {
				method: 'POST',
				body: formData,
			});

			const data = (await res.json()) as { success?: boolean; image?: GalleryImage; error?: string };

			if (res.ok && data.success && data.image) {
				onSuccess(data.image);
				resetForm();
				onClose();
			} else {
				setError(data.error || 'Failed to upload photo');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error while uploading');
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className='admin-modal-backdrop' onClick={handleClose}>
			<div
				className='admin-modal'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between pb-4 mb-4 border-b border-yorha/15'>
					<h2 className='text-base font-bold uppercase tracking-wider text-yorha m-0 flex items-center gap-2'>
						<Upload size={18} />
						Upload Gallery Image
					</h2>
					<button
						onClick={handleClose}
						className='text-yorha/50 hover:text-yorha p-1 cursor-pointer transition-colors'
						aria-label='Close'
					>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* File Input / Dropzone */}
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-yorha/80 mb-2'>
							Select Image *
						</label>
						<div
							onClick={() => fileInputRef.current?.click()}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors bg-black/20 flex flex-col items-center justify-center min-h-[140px] ${
								isDragging
									? 'border-yorha bg-yorha/10'
									: 'border-yorha/30 hover:border-yorha/60'
							}`}
						>
							<input
								ref={fileInputRef}
								type='file'
								accept='image/jpeg,image/png,image/webp,image/avif,image/gif'
								onChange={handleFileChange}
								className='hidden'
							/>
							{previewUrl ? (
								<div className='flex flex-col items-center gap-2'>
									<img
										src={previewUrl}
										alt='Preview'
										className='max-h-32 rounded object-contain border border-yorha/20'
									/>
									<span className='text-xs text-yorha/70 font-mono'>
										{file?.name} ({(file!.size / (1024 * 1024)).toFixed(2)} MB)
									</span>
									<span className='text-[10px] text-yorha/40 underline'>
										Click or drop another image to replace
									</span>
								</div>
							) : (
								<div className='flex flex-col items-center gap-2 text-yorha/60'>
									<ImageIcon size={32} />
									<span className='text-xs font-medium'>
										Click or drag photo here to upload
									</span>
									<span className='text-[11px] text-yorha/40'>
										Supports JPG, PNG, WEBP, AVIF (EXIF auto-detected)
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Metadata detection status */}
					{detectingMetadata && (
						<div className='flex items-center gap-2 p-2.5 bg-yorha/5 border border-yorha/20 rounded text-yorha text-xs font-mono'>
							<div className='w-3.5 h-3.5 border-2 border-yorha/30 border-t-yorha rounded-full animate-spin shrink-0' />
							<span>Reading EXIF metadata from photo...</span>
						</div>
					)}

					{!detectingMetadata && detectedFields.length > 0 && (
						<div className='flex items-center gap-2 p-2.5 bg-yorha/10 border border-yorha/20 rounded text-yorha text-xs font-mono'>
							<Sparkles size={14} className='text-yorha shrink-0' />
							<span className='truncate'>
								Auto-detected EXIF: <strong>{detectedFields.join(', ')}</strong>
							</span>
						</div>
					)}

					{/* Metadata fields */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 pt-1'>
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
								disabled={uploading}
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
								disabled={uploading}
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
								disabled={uploading}
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
								disabled={uploading}
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
								disabled={uploading}
							/>
						</div>

						<div>
							<label className='block text-[11px] font-semibold uppercase tracking-wider text-yorha/70 mb-1'>
								Resolution
							</label>
							<input
								type='text'
								value={resolution || (file ? 'Detecting...' : 'Auto on selection')}
								disabled
								className='admin-input text-xs opacity-75 cursor-not-allowed font-mono'
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
							disabled={uploading}
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
							disabled={uploading}
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
							onClick={handleClose}
							disabled={uploading}
							className='admin-btn admin-btn-secondary'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={uploading || !file}
							className='admin-btn'
						>
							{uploading ? (
								<>
									<div className='w-4 h-4 border-2 border-yorha-dark/40 border-t-yorha-dark rounded-full animate-spin' />
									<span>Uploading to R2...</span>
								</>
							) : (
								<>
									<Upload size={15} />
									<span>Upload Image</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
