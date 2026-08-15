export interface GalleryImage {
	/** R2 object key (e.g., "sunset-001.jpg") */
	key: string;
	/** Display title from R2 custom metadata */
	title?: string;
	/** ISO or YYYY-MM-DD date string from R2 custom metadata */
	date?: string;
	/** Description from R2 custom metadata */
	description?: string;
	/** Camera name/model */
	camera_name?: string;
	/** Location where the photo was taken */
	location?: string;
	/** Lens focal length (e.g. "35mm") */
	focal_length?: string;
	/** Lens aperture (e.g. "f/1.8") */
	aperture?: string;
	/** Image resolution (e.g. "6000x4000", auto-detected) */
	resolution?: string;
	/** File size in bytes */
	size: number;
}

