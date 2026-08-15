import "./set-env";
import handler from "vinext/server/app-router-entry";
import { handleImageOptimization } from "vinext/server/image-optimization";

interface Env {
	ASSETS: { fetch: (req: Request | string) => Promise<Response> };
	IMAGES: {
		input(stream: ReadableStream): {
			transform(options: Record<string, unknown>): {
				output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
			};
		};
	};
	GALLERY_BUCKET: R2Bucket;
	GAME_BUCKET: R2Bucket;
	ADMIN_PASSWORD?: string;
	JWT_SECRET?: string;
}

const HEADER_RULES: Array<{ pattern: string; headers: Record<string, string> }> = [
	{
		pattern: "/*",
		headers: {
			"Cache-Control": "public, max-age=604800",
			"X-Frame-Options": "SAMEORIGIN",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	},
	{
		pattern: "/contact",
		headers: {
			"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
			"Cache-Control": "public, max-age=604800",
		},
	},
	{
		pattern: "/sitemap.xml",
		headers: { "Cache-Control": "public, max-age=86400" },
	},
	{
		pattern: "/robots.txt",
		headers: { "Cache-Control": "public, max-age=86400" },
	},
	{
		pattern: "/fonts/*.ttf",
		headers: { "Cache-Control": "public, max-age=2592000, immutable" },
	},
	{
		pattern: "/models/*.glb",
		headers: { "Cache-Control": "public, max-age=2592000, immutable" },
	},
	{
		pattern: "/models/*.gltf",
		headers: { "Cache-Control": "public, max-age=2592000, immutable" },
	},
	{
		pattern: "/models/*.obj",
		headers: { "Cache-Control": "public, max-age=2592000, immutable" },
	},
	{
		pattern: "/fonts/*",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/*.png",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/*.jpg",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/*.jpeg",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/*.svg",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/assets/*.js",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
	{
		pattern: "/assets/*.css",
		headers: { "Cache-Control": "public, max-age=31536000, immutable" },
	},
];

function matchesPattern(pathname: string, pattern: string): boolean {
	if (pattern === "/*") return true;
	if (!pattern.includes("*")) return pathname === pattern;
	const regexStr =
		"^" +
		pattern
			.split("*")
			.map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
			.join("[^/]*") +
		"$";
	return new RegExp(regexStr).test(pathname);
}

function applyHeaderRules(response: Response, pathname: string, isRsc: boolean): Response {
	const headers = new Headers(response.headers);
	for (const rule of HEADER_RULES) {
		if (matchesPattern(pathname, rule.pattern)) {
			for (const [name, value] of Object.entries(rule.headers)) {
				if (name.toLowerCase() === "cache-control" && (headers.has("Cache-Control") || isRsc)) {
					continue;
				}
				headers.set(name, value);
			}
		}
	}
	if (isRsc) {
		headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

// ---------- Types & Helpers ----------

interface GalleryImage {
	key: string;
	title?: string;
	date?: string;
	description?: string;
	camera_name?: string;
	location?: string;
	focal_length?: string;
	aperture?: string;
	resolution?: string;
	size: number;
}

// ---------- JWT & Auth Helpers (Web Crypto HMAC-SHA256) ----------

function base64UrlEncode(strOrBuffer: string | Uint8Array | ArrayBuffer): string {
	let bytes: Uint8Array;
	if (typeof strOrBuffer === "string") {
		bytes = new TextEncoder().encode(strOrBuffer);
	} else if (strOrBuffer instanceof Uint8Array) {
		bytes = strOrBuffer;
	} else {
		bytes = new Uint8Array(strOrBuffer);
	}
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	while (base64.length % 4) {
		base64 += "=";
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
	const keyData = new TextEncoder().encode(secret || "personal-site-dev-secret-key-32charsmin");
	return await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	);
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
	const header = { alg: "HS256", typ: "JWT" };
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const data = `${encodedHeader}.${encodedPayload}`;
	const key = await getCryptoKey(secret);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data)
	);
	const encodedSignature = base64UrlEncode(signature);
	return `${data}.${encodedSignature}`;
}

async function verifyJwt(token: string, secret: string): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return { valid: false };
		const [encodedHeader, encodedPayload, encodedSignature] = parts;
		const data = `${encodedHeader}.${encodedPayload}`;
		const key = await getCryptoKey(secret);

		let base64 = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
		while (base64.length % 4) base64 += "=";
		const binary = atob(base64);
		const sigBytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			sigBytes[i] = binary.charCodeAt(i);
		}

		const isValid = await crypto.subtle.verify(
			"HMAC",
			key,
			sigBytes,
			new TextEncoder().encode(data)
		);
		if (!isValid) return { valid: false };

		const payload = JSON.parse(base64UrlDecode(encodedPayload));
		if (payload.exp && typeof payload.exp === "number") {
			if (Date.now() >= payload.exp * 1000) {
				return { valid: false };
			}
		}
		return { valid: true, payload };
	} catch {
		return { valid: false };
	}
}

function parseCookies(header: string | null): Record<string, string> {
	const cookies: Record<string, string> = {};
	if (!header) return cookies;
	const pairs = header.split(";");
	for (const pair of pairs) {
		const [key, ...vals] = pair.trim().split("=");
		if (key) {
			cookies[key] = decodeURIComponent(vals.join("="));
		}
	}
	return cookies;
}

function getAdminPassword(env: Env): string {
	return (
		env.ADMIN_PASSWORD ||
		(typeof process !== "undefined" && process.env?.ADMIN_PASSWORD) ||
		"admin"
	);
}

function getJwtSecret(env: Env): string {
	return (
		env.JWT_SECRET ||
		(typeof process !== "undefined" && process.env?.JWT_SECRET) ||
		"personal-site-dev-secret-key-32charsmin"
	);
}

async function verifyAdminAuth(request: Request, env: Env): Promise<boolean> {
	const cookieHeader = request.headers.get("Cookie");
	const cookies = parseCookies(cookieHeader);
	const token = cookies["admin_token"] || request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
	if (!token) return false;
	const secret = getJwtSecret(env);
	const result = await verifyJwt(token, secret);
	return result.valid && result.payload?.sub === "admin";
}

// ---------- Image Resolution Detection (Header Parsing) ----------

function getImageDimensions(buffer: Uint8Array): { width: number; height: number } | null {
	if (buffer.length < 24) return null;

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		const width = view.getUint32(16, false);
		const height = view.getUint32(20, false);
		return { width, height };
	}

	// GIF: GIF87a or GIF89a
	if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		const width = view.getUint16(6, true);
		const height = view.getUint16(8, true);
		return { width, height };
	}

	// WebP: RIFF....WEBP
	if (
		buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
		buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
	) {
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		// VP8 (lossy)
		if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
			if (buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
				const width = view.getUint16(26, true) & 0x3fff;
				const height = view.getUint16(28, true) & 0x3fff;
				return { width, height };
			}
		}
		// VP8L (lossless)
		if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4c) {
			if (buffer.length >= 25 && buffer[20] === 0x2f) {
				const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
				const width = 1 + (((b2 & 0x3f) << 8) | b1);
				const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
				return { width, height };
			}
		}
		// VP8X (extended)
		if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
			if (buffer.length >= 30) {
				const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
				const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
				return { width, height };
			}
		}
	}

	// JPEG: FF D8 ...
	if (buffer[0] === 0xff && buffer[1] === 0xd8) {
		let offset = 2;
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		while (offset < buffer.length) {
			if (buffer[offset] !== 0xff) {
				offset++;
				continue;
			}
			const marker = buffer[offset + 1];
			// SOF markers
			if (
				(marker >= 0xc0 && marker <= 0xc3) ||
				(marker >= 0xc5 && marker <= 0xc7) ||
				(marker >= 0xc9 && marker <= 0xcb) ||
				(marker >= 0xcd && marker <= 0xcf)
			) {
				if (offset + 9 <= buffer.length) {
					const height = view.getUint16(offset + 5, false);
					const width = view.getUint16(offset + 7, false);
					return { width, height };
				}
				break;
			}
			if (marker === 0xd9 || marker === 0xda) {
				break;
			}
			if (offset + 4 <= buffer.length) {
				const length = view.getUint16(offset + 2, false);
				offset += 2 + length;
			} else {
				break;
			}
		}
	}

	return null;
}

// ---------- Gallery API helpers ----------

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "tiff", "bmp"]);
const THUMBNAIL_PREFIX = "_thumbnails/";
const THUMBNAIL_WIDTH = 720;
const THUMBNAIL_QUALITY = 80;
const THUMBNAIL_FORMAT = "webp";

function isImageKey(key: string): boolean {
	const ext = key.split(".").pop()?.toLowerCase() ?? "";
	return IMAGE_EXTENSIONS.has(ext) && !key.startsWith(THUMBNAIL_PREFIX);
}

function contentTypeFromKey(key: string): string {
	const ext = key.split(".").pop()?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		avif: "image/avif",
		gif: "image/gif",
		tiff: "image/tiff",
		bmp: "image/bmp",
	};
	return map[ext] ?? "application/octet-stream";
}

function thumbnailKeyFor(originalKey: string): string {
	const baseName = originalKey.replace(/\.[^.]+$/, "");
	return `${THUMBNAIL_PREFIX}${baseName}.${THUMBNAIL_FORMAT}`;
}

function mapR2ObjectToGalleryImage(obj: R2Object): GalleryImage {
	return {
		key: obj.key,
		title: obj.customMetadata?.title || undefined,
		date: obj.customMetadata?.date || undefined,
		description: obj.customMetadata?.description || undefined,
		camera_name: obj.customMetadata?.camera_name || undefined,
		location: obj.customMetadata?.location || undefined,
		focal_length: obj.customMetadata?.focal_length || undefined,
		aperture: obj.customMetadata?.aperture || undefined,
		resolution: obj.customMetadata?.resolution || undefined,
		size: obj.size,
	};
}

/**
 * Sorts gallery images by:
 * 1. date descending (newest first)
 * 2. camera_name ascending
 * 3. focal_length numeric ascending
 * 4. aperture numeric ascending
 * 5. resolution (total pixels descending)
 */
function compareGalleryImages(a: GalleryImage, b: GalleryImage): number {
	// 1. Date (newest first)
	if (a.date !== b.date) {
		if (a.date && b.date) {
			const diff = b.date.localeCompare(a.date);
			if (diff !== 0) return diff;
		} else if (a.date) {
			return -1;
		} else if (b.date) {
			return 1;
		}
	}

	// 2. Camera name (ascending)
	const camA = (a.camera_name || "").trim().toLowerCase();
	const camB = (b.camera_name || "").trim().toLowerCase();
	if (camA !== camB) {
		if (camA && camB) {
			const diff = camA.localeCompare(camB);
			if (diff !== 0) return diff;
		} else if (camA) {
			return -1;
		} else if (camB) {
			return 1;
		}
	}

	// 3. Focal length (numeric ascending)
	const parseFocalLength = (fl?: string): number => {
		if (!fl) return Number.MAX_VALUE;
		const match = fl.match(/[\d.]+/);
		return match ? parseFloat(match[0]) : Number.MAX_VALUE;
	};
	const flA = parseFocalLength(a.focal_length);
	const flB = parseFocalLength(b.focal_length);
	if (flA !== flB) return flA - flB;

	// 4. Aperture (numeric ascending)
	const parseAperture = (ap?: string): number => {
		if (!ap) return Number.MAX_VALUE;
		const match = ap.match(/[\d.]+/);
		return match ? parseFloat(match[0]) : Number.MAX_VALUE;
	};
	const apA = parseAperture(a.aperture);
	const apB = parseAperture(b.aperture);
	if (apA !== apB) return apA - apB;

	// 5. Resolution (total pixels descending)
	const parseResolution = (res?: string): number => {
		if (!res) return 0;
		const parts = res.toLowerCase().split("x");
		if (parts.length === 2) {
			const w = parseInt(parts[0], 10);
			const h = parseInt(parts[1], 10);
			if (!isNaN(w) && !isNaN(h)) return w * h;
		}
		return 0;
	};
	const resA = parseResolution(a.resolution);
	const resB = parseResolution(b.resolution);
	if (resA !== resB) return resB - resA;

	// Tie-breaker
	return a.key.localeCompare(b.key);
}

async function handleGalleryList(env: Env): Promise<Response> {
	const listed = await env.GALLERY_BUCKET.list({
		limit: 1000,
		include: ["customMetadata", "httpMetadata"],
	});
	const images = listed.objects
		.filter((obj) => isImageKey(obj.key))
		.map(mapR2ObjectToGalleryImage);

	images.sort(compareGalleryImages);

	return new Response(JSON.stringify(images), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300, s-maxage=60",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

/**
 * Serves a cached WebP thumbnail from R2, generating it on first request.
 */
async function handleGalleryThumbnail(key: string, env: Env, request: Request): Promise<Response> {
	const thumbKey = thumbnailKeyFor(key);

	// Strategy 1: Serve previously-cached thumbnail from R2
	const cached = await env.GALLERY_BUCKET.get(thumbKey);
	if (cached) {
		return new Response(cached.body, {
			headers: {
				"Content-Type": "image/webp",
				"Cache-Control": "public, max-age=2592000, immutable",
			},
		});
	}

	// Strategy 2: Generate via IMAGES binding and cache to R2
	if (env.IMAGES) {
		const original = await env.GALLERY_BUCKET.get(key);
		if (!original) {
			return new Response("Not found", { status: 404 });
		}

		try {
			const result = await env.IMAGES
				.input(original.body)
				.transform({ width: THUMBNAIL_WIDTH })
				.output({ format: THUMBNAIL_FORMAT, quality: THUMBNAIL_QUALITY });

			const resized = result.response();
			const thumbnailBytes = await resized.arrayBuffer();

			await env.GALLERY_BUCKET.put(thumbKey, thumbnailBytes, {
				httpMetadata: { contentType: "image/webp" },
			});

			return new Response(thumbnailBytes, {
				headers: {
					"Content-Type": "image/webp",
					"Cache-Control": "public, max-age=2592000, immutable",
				},
			});
		} catch (err) {
			console.error(`[Gallery] IMAGES binding transform failed for "${key}":`, err);
		}
	} else {
		console.warn("[Gallery] IMAGES binding is not available — skipping to cf.image strategy");
	}

	// Strategy 3: Use cf.image subrequest transform (zone-level Image Resizing)
	try {
		const imageUrl = new URL(`/api/gallery/image/${encodeURIComponent(key)}`, request.url);
		const resized = await fetch(imageUrl.toString(), {
			cf: {
				image: {
					width: THUMBNAIL_WIDTH,
					quality: THUMBNAIL_QUALITY,
					format: THUMBNAIL_FORMAT,
					fit: "scale-down",
				},
			},
		} as RequestInit);

		if (!resized.ok) {
			return new Response(
				`Thumbnail generation failed: cf.image fetch returned ${resized.status}`,
				{ status: 503 },
			);
		}

		const contentType = resized.headers.get("Content-Type") || "";
		const resizedBytes = await resized.arrayBuffer();

		if (resizedBytes.byteLength < 500_000) {
			await env.GALLERY_BUCKET.put(thumbKey, resizedBytes, {
				httpMetadata: { contentType: "image/webp" },
			});
		}

		return new Response(resizedBytes, {
			headers: {
				"Content-Type": contentType || "image/webp",
				"Cache-Control": "public, max-age=2592000, immutable",
			},
		});
	} catch (err) {
		console.error(`[Gallery] cf.image transform also failed for "${key}":`, err);
		return new Response(
			`Thumbnail generation failed. IMAGES binding: ${env.IMAGES ? "available" : "MISSING"}. Error: ${err instanceof Error ? err.message : String(err)}`,
			{ status: 503 },
		);
	}
}

async function handleGalleryImage(key: string, env: Env): Promise<Response> {
	const object = await env.GALLERY_BUCKET.get(key);
	if (!object) {
		return new Response("Not found", { status: 404 });
	}

	return new Response(object.body, {
		headers: {
			"Content-Type": object.httpMetadata?.contentType || contentTypeFromKey(key),
			"Cache-Control": "public, max-age=2592000, immutable",
		},
	});
}

// ---------- Admin Handlers ----------

async function handleAdminLogin(request: Request, env: Env, url: URL): Promise<Response> {
	try {
		const body = (await request.json()) as { password?: string };
		const adminPassword = getAdminPassword(env);

		if (!body?.password || body.password !== adminPassword) {
			return new Response(JSON.stringify({ error: "Invalid password" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const secret = getJwtSecret(env);
		const iat = Math.floor(Date.now() / 1000);
		const exp = iat + 60 * 60 * 24 * 7; // 7 days

		const token = await signJwt({ sub: "admin", iat, exp }, secret);
		const isSecure = url.protocol === "https:";
		const cookie = `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${isSecure ? "; Secure" : ""}`;

		return new Response(JSON.stringify({ success: true }), {
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": cookie,
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}

async function handleAdminLogout(url: URL): Promise<Response> {
	const isSecure = url.protocol === "https:";
	const cookie = `admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? "; Secure" : ""}`;
	return new Response(JSON.stringify({ success: true }), {
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": cookie,
		},
	});
}

async function handleAdminVerify(request: Request, env: Env): Promise<Response> {
	const authenticated = await verifyAdminAuth(request, env);
	if (!authenticated) {
		return new Response(JSON.stringify({ authenticated: false, error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(JSON.stringify({ authenticated: true }), {
		headers: { "Content-Type": "application/json" },
	});
}

async function handleAdminGalleryList(request: Request, env: Env): Promise<Response> {
	if (!(await verifyAdminAuth(request, env))) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const listed = await env.GALLERY_BUCKET.list({
		limit: 1000,
		include: ["customMetadata", "httpMetadata"],
	});
	const images = listed.objects
		.filter((obj) => isImageKey(obj.key))
		.map(mapR2ObjectToGalleryImage);

	images.sort(compareGalleryImages);

	return new Response(JSON.stringify(images), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store, no-cache, must-revalidate",
		},
	});
}

async function handleAdminGalleryUpload(request: Request, env: Env): Promise<Response> {
	if (!(await verifyAdminAuth(request, env))) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file");
		if (!file || !(file instanceof File)) {
			return new Response(JSON.stringify({ error: "No file uploaded" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const camera_name = (formData.get("camera_name") as string | null) || "";
		const location = (formData.get("location") as string | null) || "";
		const date = (formData.get("date") as string | null) || "";
		const focal_length = (formData.get("focal_length") as string | null) || "";
		const aperture = (formData.get("aperture") as string | null) || "";
		const title = (formData.get("title") as string | null) || "";
		const description = (formData.get("description") as string | null) || "";

		let originalName = file.name || "image.jpg";
		let safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
		let key = safeName;
		const existing = await env.GALLERY_BUCKET.head(key);
		if (existing) {
			const ext = key.includes(".") ? `.${key.split(".").pop()}` : "";
			const nameWithoutExt = key.replace(/\.[^.]+$/, "");
			key = `${nameWithoutExt}-${Date.now()}${ext}`;
		}

		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Auto-detect resolution
		let resolution = "";
		const dims = getImageDimensions(uint8Array);
		if (dims) {
			resolution = `${dims.width}x${dims.height}`;
		}

		const customMetadata: Record<string, string> = {};
		if (camera_name.trim()) customMetadata.camera_name = camera_name.trim();
		if (location.trim()) customMetadata.location = location.trim();
		if (date.trim()) customMetadata.date = date.trim();
		if (focal_length.trim()) customMetadata.focal_length = focal_length.trim();
		if (aperture.trim()) customMetadata.aperture = aperture.trim();
		if (resolution.trim()) customMetadata.resolution = resolution.trim();
		if (title.trim()) customMetadata.title = title.trim();
		if (description.trim()) customMetadata.description = description.trim();

		const contentType = file.type || contentTypeFromKey(key);

		await env.GALLERY_BUCKET.put(key, arrayBuffer, {
			httpMetadata: { contentType },
			customMetadata,
		});

		// Attempt background/eager thumbnail generation
		const thumbKey = thumbnailKeyFor(key);
		if (env.IMAGES) {
			try {
				const result = await env.IMAGES
					.input(new Uint8Array(arrayBuffer) as any)
					.transform({ width: THUMBNAIL_WIDTH })
					.output({ format: THUMBNAIL_FORMAT, quality: THUMBNAIL_QUALITY });
				const resized = result.response();
				const thumbBytes = await resized.arrayBuffer();
				await env.GALLERY_BUCKET.put(thumbKey, thumbBytes, {
					httpMetadata: { contentType: "image/webp" },
				});
			} catch (e) {
				console.warn("[Admin Upload] Thumbnail generation deferred:", e);
			}
		}

		const image: GalleryImage = {
			key,
			title: customMetadata.title,
			date: customMetadata.date,
			description: customMetadata.description,
			camera_name: customMetadata.camera_name,
			location: customMetadata.location,
			focal_length: customMetadata.focal_length,
			aperture: customMetadata.aperture,
			resolution: customMetadata.resolution,
			size: arrayBuffer.byteLength,
		};

		return new Response(JSON.stringify({ success: true, image }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Upload failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

async function handleAdminGalleryUpdateMetadata(key: string, request: Request, env: Env): Promise<Response> {
	if (!(await verifyAdminAuth(request, env))) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const existing = await env.GALLERY_BUCKET.get(key);
		if (!existing) {
			return new Response(JSON.stringify({ error: "Image not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = (await request.json()) as Record<string, any>;
		const customMetadata: Record<string, string> = { ...(existing.customMetadata || {}) };

		if ("camera_name" in body) {
			if (typeof body.camera_name === "string" && body.camera_name.trim()) customMetadata.camera_name = body.camera_name.trim();
			else delete customMetadata.camera_name;
		}
		if ("location" in body) {
			if (typeof body.location === "string" && body.location.trim()) customMetadata.location = body.location.trim();
			else delete customMetadata.location;
		}
		if ("date" in body) {
			if (typeof body.date === "string" && body.date.trim()) customMetadata.date = body.date.trim();
			else delete customMetadata.date;
		}
		if ("focal_length" in body) {
			if (typeof body.focal_length === "string" && body.focal_length.trim()) customMetadata.focal_length = body.focal_length.trim();
			else delete customMetadata.focal_length;
		}
		if ("aperture" in body) {
			if (typeof body.aperture === "string" && body.aperture.trim()) customMetadata.aperture = body.aperture.trim();
			else delete customMetadata.aperture;
		}
		if ("title" in body) {
			if (typeof body.title === "string" && body.title.trim()) customMetadata.title = body.title.trim();
			else delete customMetadata.title;
		}
		if ("description" in body) {
			if (typeof body.description === "string" && body.description.trim()) customMetadata.description = body.description.trim();
			else delete customMetadata.description;
		}

		await env.GALLERY_BUCKET.put(key, existing.body, {
			httpMetadata: {
				...existing.httpMetadata,
				contentType: existing.httpMetadata?.contentType || contentTypeFromKey(key),
			},
			customMetadata,
		});

		const image: GalleryImage = {
			key,
			title: customMetadata.title,
			date: customMetadata.date,
			description: customMetadata.description,
			camera_name: customMetadata.camera_name,
			location: customMetadata.location,
			focal_length: customMetadata.focal_length,
			aperture: customMetadata.aperture,
			resolution: customMetadata.resolution,
			size: existing.size,
		};

		return new Response(JSON.stringify({ success: true, image }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Update failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

async function handleAdminGalleryDelete(key: string, request: Request, env: Env): Promise<Response> {
	if (!(await verifyAdminAuth(request, env))) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		await env.GALLERY_BUCKET.delete(key);
		await env.GALLERY_BUCKET.delete(thumbnailKeyFor(key));
		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Delete failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		const isRsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");

		if (url.pathname === "/_vinext/image") {
			const response = await handleImageOptimization(request, {
				fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
				transformImage: async (body, { width, format, quality }) => {
					const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
					return result.response();
				},
			});
			return applyHeaderRules(response, url.pathname, isRsc);
		}

		// Admin API routes
		if (url.pathname === "/api/admin/login" && request.method === "POST") {
			return handleAdminLogin(request, env, url);
		}

		if (url.pathname === "/api/admin/logout" && request.method === "POST") {
			return handleAdminLogout(url);
		}

		if (url.pathname === "/api/admin/verify" && request.method === "GET") {
			return handleAdminVerify(request, env);
		}

		if (url.pathname === "/api/admin/gallery" && request.method === "GET") {
			return handleAdminGalleryList(request, env);
		}

		if (url.pathname === "/api/admin/gallery/upload" && request.method === "POST") {
			return handleAdminGalleryUpload(request, env);
		}

		if (url.pathname.startsWith("/api/admin/gallery/") && url.pathname.endsWith("/metadata") && request.method === "PUT") {
			const key = decodeURIComponent(url.pathname.replace(/^\/api\/admin\/gallery\//, "").replace(/\/metadata$/, ""));
			return handleAdminGalleryUpdateMetadata(key, request, env);
		}

		if (url.pathname.startsWith("/api/admin/gallery/") && request.method === "DELETE") {
			const key = decodeURIComponent(url.pathname.replace(/^\/api\/admin\/gallery\//, ""));
			return handleAdminGalleryDelete(key, request, env);
		}

		// Game API routes (R2 Proxy)
		if (url.pathname.startsWith("/game/") && url.pathname !== "/game") {
			const key = decodeURIComponent(url.pathname.replace("/game/", ""));
			if (!key) return new Response("Not found", { status: 404 });
			
			const isVersionJson = key === "version.json";

			const object = isVersionJson
				? await env.GAME_BUCKET.get(key)
				: await env.GAME_BUCKET.get(key, { onlyIf: request.headers });

			if (!object) {
				return new Response("Not found", { status: 404 });
			}

			if (!("body" in object)) {
				return new Response(null, {
					status: 304,
					headers: {
						"ETag": object.httpEtag,
						"Cache-Control": "no-cache, must-revalidate",
						"X-Frame-Options": "SAMEORIGIN",
					},
				});
			}

			let contentType = object.httpMetadata?.contentType || "application/octet-stream";
			if (!object.httpMetadata?.contentType) {
				const ext = key.split('.').pop()?.toLowerCase() || '';
				const contentTypes: Record<string, string> = {
					'html': 'text/html',
					'js': 'application/javascript',
					'wasm': 'application/wasm',
					'pck': 'application/octet-stream',
					'png': 'image/png',
					'json': 'application/json',
				};
				if (contentTypes[ext]) {
					contentType = contentTypes[ext];
				}
			}

			const cacheControl = isVersionJson
				? "no-store, no-cache, must-revalidate, max-age=0"
				: "no-cache, must-revalidate";

			const responseHeaders: Record<string, string> = {
				"Content-Type": contentType,
				"Cache-Control": cacheControl,
				"X-Frame-Options": "SAMEORIGIN",
			};

			if (object.httpEtag) {
				responseHeaders["ETag"] = object.httpEtag;
			}

			return new Response(object.body as BodyInit, {
				headers: responseHeaders,
			});
		}

		// Gallery API routes
		if (url.pathname === "/api/gallery") {
			return handleGalleryList(env);
		}

		if (url.pathname.startsWith("/api/gallery/thumbnail/")) {
			const key = decodeURIComponent(url.pathname.replace("/api/gallery/thumbnail/", ""));
			return handleGalleryThumbnail(key, env, request);
		}

		if (url.pathname.startsWith("/api/gallery/image/")) {
			const key = decodeURIComponent(url.pathname.replace("/api/gallery/image/", ""));
			return handleGalleryImage(key, env);
		}

		const response = await handler.fetch(request);
		return applyHeaderRules(response, url.pathname, isRsc);
	},
};

