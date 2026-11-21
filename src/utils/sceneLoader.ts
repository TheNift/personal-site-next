import { getAllAssetPaths, getAllObjAssetPaths } from './assetRegistry';

interface LoadingProgress {
	(progress: number): void;
}

interface AssetPreloaders {
	gltf: (path: string) => void;
	obj: (path: string) => void;
}

export const preloadThreeJSAssets = async (
	preloaders: AssetPreloaders,
	onProgress: LoadingProgress
): Promise<void> => {
	const assets = [
		...getAllAssetPaths().map((path) => ({
			path,
			preload: preloaders.gltf,
		})),
		...getAllObjAssetPaths().map((path) => ({
			path,
			preload: preloaders.obj,
		})),
	];

	let itemsLoaded = 0;
	const totalItems = assets.length;

	const loadPromises = assets.map(async ({ path, preload }, index) => {
		try {
			await new Promise(resolve => setTimeout(resolve, index * 20)); // Feels bad, but staggering the loading to be nicer to webgl
			preload(path);
			itemsLoaded++;
			const progress = (itemsLoaded / totalItems) * 100;
			onProgress(progress);
		} catch (error) {
			console.error(`Failed to preload ${path}:`, error);
			itemsLoaded++;
			const progress = (itemsLoaded / totalItems) * 100;
			onProgress(progress);
		}
	});

	await Promise.all(loadPromises);
	onProgress(100);
};
