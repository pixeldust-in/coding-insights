import { statSync } from 'fs';

interface CacheEntry<T> {
	data: T;
	mtime: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(path: string, loader: () => T): T {
	try {
		const stat = statSync(path);
		const mtime = stat.mtimeMs;
		const existing = cache.get(path) as CacheEntry<T> | undefined;
		if (existing && existing.mtime === mtime) {
			return existing.data;
		}
		const data = loader();
		cache.set(path, { data, mtime });
		return data;
	} catch {
		const existing = cache.get(path) as CacheEntry<T> | undefined;
		if (existing) return existing.data;
		throw new Error(`Failed to load: ${path}`);
	}
}

export async function getCachedAsync<T>(path: string, loader: () => Promise<T>): Promise<T> {
	try {
		const stat = statSync(path);
		const mtime = stat.mtimeMs;
		const existing = cache.get(path) as CacheEntry<T> | undefined;
		if (existing && existing.mtime === mtime) {
			return existing.data;
		}
		const data = await loader();
		cache.set(path, { data, mtime });
		return data;
	} catch {
		const existing = cache.get(path) as CacheEntry<T> | undefined;
		if (existing) return existing.data;
		throw new Error(`Failed to load: ${path}`);
	}
}
