import { SetMetadata } from '@nestjs/common';

export interface CacheOptions {
  key?: string;
  ttl?: number; // TTL in seconds
}

export const Cacheable = (options: CacheOptions = {}) =>
  SetMetadata('cache', options);

// Helper decorators for common cache patterns
export const CacheKey = (key: string) => SetMetadata('cache-key', key);
export const CacheTTL = (ttl: number) => SetMetadata('cache-ttl', ttl);