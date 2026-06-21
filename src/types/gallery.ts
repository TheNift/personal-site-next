export interface GalleryImage {
	/** R2 object key (e.g., "sunset-001.jpg") */
	key: string;
	/** Display title from R2 custom metadata */
	title?: string;
	/** ISO date string from R2 custom metadata */
	date?: string;
	/** Description from R2 custom metadata */
	description?: string;
	/** File size in bytes */
	size: number;
}
