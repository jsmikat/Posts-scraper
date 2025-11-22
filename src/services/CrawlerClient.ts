import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CrawlerClient {
  protected client: AxiosInstance;
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.client = axios.create({
      timeout: config.crawl.requestTimeout,
    });

    this.cache = new Map();

    this.client.interceptors.response.use(
      (response) => {
        logger.info('RapidAPI request successful', {
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error) => {
        logger.error('RapidAPI request failed', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  protected async getCached<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    if (!config.crawl.enableCaching) {
      return fetchFn();
    }

    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    
    if (cached && now - cached.timestamp < config.crawl.cacheTTL) {
      logger.info(`Cache hit for key: ${cacheKey}`);
      return cached.data as T;
    }

    
    logger.info(`Cache miss for key: ${cacheKey}, fetching from API`);
    const data = await fetchFn();

    
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
    });

    return data;
  }

 
  protected clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= config.crawl.cacheTTL) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      logger.info(`Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

 
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
