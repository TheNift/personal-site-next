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
}

const HEADER_RULES: Array<{ pattern: string; headers: Record<string, string> }> = [
	{
		pattern: "/*",
		headers: {
			"Cache-Control": "public, max-age=604800",
			"X-Frame-Options": "DENY",
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

// ---------- Gallery API helpers ----------

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "tiff", "bmp"]);

function isImageKey(key: string): boolean {
	const ext = key.split(".").pop()?.toLowerCase() ?? "";
	return IMAGE_EXTENSIONS.has(ext);
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

async function handleGalleryList(env: Env): Promise<Response> {
	const listed = await env.GALLERY_BUCKET.list({ limit: 1000 });
	const images = listed.objects
		.filter((obj) => isImageKey(obj.key))
		.map((obj) => ({
			key: obj.key,
			title: obj.customMetadata?.title || undefined,
			date: obj.customMetadata?.date || undefined,
			description: obj.customMetadata?.description || undefined,
			size: obj.size,
		}));

	// Sort by date descending (newest first), then by key
	images.sort((a, b) => {
		if (a.date && b.date) return b.date.localeCompare(a.date);
		if (a.date) return -1;
		if (b.date) return 1;
		return a.key.localeCompare(b.key);
	});

	return new Response(JSON.stringify(images), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300, s-maxage=60",
			"Access-Control-Allow-Origin": "*",
		},
	});
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

// ---------- Main fetch handler ----------

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		// console.log("[SERVER WORKER DEBUG] url:", request.url);
		// console.log("[SERVER WORKER DEBUG] process.env:", typeof process !== "undefined" ? JSON.stringify(process.env) : "no process");
		// console.log("[SERVER WORKER DEBUG] env keys:", Object.keys(env));

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

		// Gallery API routes
		if (url.pathname === "/api/gallery") {
			return handleGalleryList(env);
		}

		if (url.pathname.startsWith("/api/gallery/image/")) {
			const key = decodeURIComponent(url.pathname.replace("/api/gallery/image/", ""));
			return handleGalleryImage(key, env);
		}

		const response = await handler.fetch(request);
		return applyHeaderRules(response, url.pathname, isRsc);
	},
};
