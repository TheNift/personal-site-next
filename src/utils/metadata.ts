import exifr from 'exifr';

export interface ExtractedMetadata {
	camera_name?: string;
	location?: string;
	date?: string;
	focal_length?: string;
	aperture?: string;
	resolution?: string;
}

/**
 * Normalizes camera Make and Model into a clean display name.
 * e.g. Make: "SONY", Model: "ILCE-7M4" -> "Sony ILCE-7M4"
 *      Make: "Canon", Model: "Canon EOS R5" -> "Canon EOS R5"
 */
export function formatCameraName(make?: string, model?: string): string | undefined {
	if (!make && !model) return undefined;

	let cleanMake = (make || '').trim();
	const cleanModel = (model || '').trim();

	// Remove common corporate suffixes
	cleanMake = cleanMake
		.replace(/corporation/gi, '')
		.replace(/camera ag/gi, '')
		.replace(/co\.,?\s*ltd\.?/gi, '')
		.replace(/inc\.?/gi, '')
		.trim();

	// Normalize uppercase makes (e.g. SONY -> Sony, NIKON -> Nikon)
	if (cleanMake.length > 0 && cleanMake === cleanMake.toUpperCase()) {
		cleanMake = cleanMake.charAt(0) + cleanMake.slice(1).toLowerCase();
	}

	if (!cleanMake) return cleanModel || undefined;
	if (!cleanModel) return cleanMake;

	// If the model already includes the make, use model directly
	if (cleanModel.toLowerCase().includes(cleanMake.toLowerCase())) {
		return cleanModel;
	}

	return `${cleanMake} ${cleanModel}`.trim();
}

/**
 * Formats focal length to a standard display format, e.g. "35mm" or "24.5mm".
 */
export function formatFocalLength(focalLength?: number | string): string | undefined {
	if (focalLength === undefined || focalLength === null || focalLength === '') return undefined;
	const num = typeof focalLength === 'number' ? focalLength : parseFloat(focalLength);
	if (isNaN(num) || num <= 0) return undefined;
	return Number.isInteger(num) ? `${num}mm` : `${parseFloat(num.toFixed(1))}mm`;
}

/**
 * Formats aperture / f-number to standard display format, e.g. "f/1.8" or "f/4".
 */
export function formatAperture(fNumber?: number | string): string | undefined {
	if (fNumber === undefined || fNumber === null || fNumber === '') return undefined;
	const num = typeof fNumber === 'number' ? fNumber : parseFloat(fNumber);
	if (isNaN(num) || num <= 0) return undefined;
	const val = Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
	return `f/${val}`;
}

/**
 * Formats EXIF date to YYYY-MM-DD string for HTML date input.
 */
export function formatDate(rawDate?: Date | string | number): string | undefined {
	if (!rawDate) return undefined;

	if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
		const year = rawDate.getFullYear();
		const month = String(rawDate.getMonth() + 1).padStart(2, '0');
		const day = String(rawDate.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	if (typeof rawDate === 'string') {
		const match = rawDate.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})/);
		if (match) {
			return `${match[1]}-${match[2]}-${match[3]}`;
		}
		const d = new Date(rawDate);
		if (!isNaN(d.getTime())) {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}
	}

	return undefined;
}

/**
 * Formats GPS coordinates to human-readable format, e.g. "20.2506° N, 105.9745° E".
 */
export function formatCoordinates(lat: number, lon: number): string {
	const latCard = lat >= 0 ? 'N' : 'S';
	const lonCard = lon >= 0 ? 'E' : 'W';
	return `${Math.abs(lat).toFixed(4)}° ${latCard}, ${Math.abs(lon).toFixed(4)}° ${lonCard}`;
}

/**
 * Optional reverse geocoding via OpenStreetMap Nominatim with a short timeout.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2500);

		const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'PersonalSite/1.0',
			},
		});
		clearTimeout(timeoutId);

		if (!res.ok) return undefined;

		const data = (await res.json()) as {
			address?: {
				city?: string;
				town?: string;
				village?: string;
				municipality?: string;
				county?: string;
				state?: string;
				country?: string;
			};
		};

		if (data.address) {
			const place =
				data.address.city ||
				data.address.town ||
				data.address.village ||
				data.address.municipality ||
				data.address.county ||
				data.address.state;
			const country = data.address.country;

			if (place && country) return `${place}, ${country}`;
			if (country) return country;
			if (place) return place;
		}
	} catch {
		// Ignore any network/abort errors and fall back gracefully
	}
	return undefined;
}

/**
 * Detects image dimensions using the browser Image API.
 */
export async function getBrowserImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
	if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		img.src = url;
	});
}

/**
 * Parses EXIF metadata from an image file, blob, or array buffer.
 */
export async function extractExifMetadata(
	input: File | Blob | ArrayBuffer | Uint8Array,
	options: { reverseGeocodeGps?: boolean } = { reverseGeocodeGps: true }
): Promise<ExtractedMetadata> {
	try {
		const parsed = await exifr.parse(input, {
			tiff: true,
			exif: true,
			gps: true,
			translateKeys: true,
			translateValues: true,
			reviveValues: true,
		});

		if (!parsed) return {};

		const camera_name = formatCameraName(parsed.Make, parsed.Model);
		const focal_length = formatFocalLength(parsed.FocalLength ?? parsed.FocalLengthIn35mmFormat);
		const aperture = formatAperture(parsed.FNumber ?? parsed.ApertureValue);
		const date = formatDate(parsed.DateTimeOriginal ?? parsed.CreateDate ?? parsed.ModifyDate);

		let location: string | undefined;
		if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
			if (options.reverseGeocodeGps) {
				const geocoded = await reverseGeocode(parsed.latitude, parsed.longitude);
				location = geocoded || formatCoordinates(parsed.latitude, parsed.longitude);
			} else {
				location = formatCoordinates(parsed.latitude, parsed.longitude);
			}
		}

		let resolution: string | undefined;
		const width = parsed.ExifImageWidth || parsed.ImageWidth;
		const height = parsed.ExifImageHeight || parsed.ImageHeight;
		if (width && height) {
			resolution = `${width}x${height}`;
		}

		return {
			camera_name,
			focal_length,
			aperture,
			date,
			location,
			resolution,
		};
	} catch (e) {
		console.warn('Failed to parse EXIF metadata:', e);
		return {};
	}
}
