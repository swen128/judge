import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { RemoteCache, CachedContent } from '../types/index.js';

export class RemoteCacheImpl implements RemoteCache {
  constructor(private cacheDir: string) {}

  async get(url: string): Promise<CachedContent | null> {
    const hash = this.getUrlHash(url);
    const cachePath = join(this.cacheDir, `${hash}.json`);
    
    try {
      const content = await readFile(cachePath, 'utf-8');
      const cached = JSON.parse(content) as CachedContent;
      cached.timestamp = new Date(cached.timestamp);
      return cached;
    } catch {
      return null;
    }
  }

  async set(url: string, content: string, headers: Record<string, string>): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    
    const hash = this.getUrlHash(url);
    const contentHash = this.getContentHash(content);
    const cachePath = join(this.cacheDir, `${hash}.json`);
    
    const cached: CachedContent = {
      content,
      timestamp: new Date(),
      headers,
      hash: contentHash,
    };
    
    await writeFile(cachePath, JSON.stringify(cached, null, 2));
  }

  async isValid(url: string, headers: Record<string, string>): Promise<boolean> {
    const cached = await this.get(url);
    if (!cached) {
      return false;
    }

    // Check ETags
    const etag = headers['etag'];
    const cachedEtag = cached.headers['etag'];
    if (etag !== undefined && cachedEtag !== undefined && etag === cachedEtag) {
      return true;
    }

    // Check Last-Modified
    const lastModified = headers['last-modified'];
    const cachedLastModified = cached.headers['last-modified'];
    if (lastModified !== undefined && cachedLastModified !== undefined) {
      const modifiedDate = new Date(lastModified);
      const cachedModifiedDate = new Date(cachedLastModified);
      return modifiedDate <= cachedModifiedDate;
    }

    // Check Cache-Control
    const cacheControl = headers['cache-control'];
    if (cacheControl !== undefined) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch !== null && maxAgeMatch[1] !== undefined) {
        const maxAge = parseInt(maxAgeMatch[1], 10) * 1000;
        const age = Date.now() - cached.timestamp.getTime();
        return age < maxAge;
      }
    }

    // Default: cache for 1 hour
    const age = Date.now() - cached.timestamp.getTime();
    return age < 3600000;
  }

  clear(): Promise<void> {
    // Not implemented for now
    return Promise.reject(new Error('Not implemented'));
  }

  private getUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private getContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}