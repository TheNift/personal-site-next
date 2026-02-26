import handler from "vinext/server/app-router-entry";
import { handleImageOptimization } from "vinext/server/image-optimization";

interface Env {
	ASSETS: Fetcher;
	IMAGES: {
		input(stream: ReadableStream): {
			transform(options: Record<string, unknown>): {
				output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
			};
		};
	};
}

const HEADER_RULES: Array<{ pattern: string; headers: Record<string, string> }> = [
	{
		pattern: "/*",
		headers: {
			"Cache-Control": "public, max-age=3600",
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	},
	{
		pattern: "/contact",
		headers: {
			"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
			"Cache-Control": "public, max-age=3600",
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
		headers: { "Cache-Control": "public, max-age=86400, immutable" },
	},
	{
		pattern: "/*.jpg",
		headers: { "Cache-Control": "public, max-age=86400, immutable" },
	},
	{
		pattern: "/*.jpeg",
		headers: { "Cache-Control": "public, max-age=86400, immutable" },
	},
	{
		pattern: "/*.svg",
		headers: { "Cache-Control": "public, max-age=86400, immutable" },
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

function applyHeaderRules(response: Response, pathname: string): Response {
	const headers = new Headers(response.headers);
	for (const rule of HEADER_RULES) {
		if (matchesPattern(pathname, rule.pattern)) {
			for (const [name, value] of Object.entries(rule.headers)) {
				headers.set(name, value);
			}
		}
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/_vinext/image") {
			const response = await handleImageOptimization(request, {
				fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
				transformImage: async (body, { width, format, quality }) => {
					const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
					return result.response();
				},
			});
			return applyHeaderRules(response, url.pathname);
		}

		const response = await handler.fetch(request);
		return applyHeaderRules(response, url.pathname);
	},
};
