import config from '../config';
import { Post, PostResult } from '../types';
import logger from '../utils/logger';
import { LinkedInCrawler } from './LinkedInCrawler';
import { RedditCrawler } from './RedditCrawler';
import { XCrawler } from './TwitterCrawler';

export class CrawlerOrchestrator {
  private redditCrawler: RedditCrawler;
  private twitterCrawler: XCrawler;
  private linkedInCrawler: LinkedInCrawler;

  constructor() {
    this.redditCrawler = new RedditCrawler();
    this.twitterCrawler = new XCrawler();
    this.linkedInCrawler = new LinkedInCrawler();
  }

  async crawlPlatforms(keywords: string[]): Promise<PostResult[]> {
    const uniqueKeywords = [...new Set(keywords.map((k) => k.trim().toLowerCase()))];

    const results: PostResult[] = [];

    for (let i = 0; i < uniqueKeywords.length; i++) {
      const keyword = uniqueKeywords[i];

      if (i > 0 && config.crawl.batchDelay > 0) {
        await this.delay(config.crawl.batchDelay);
      }

      const keywordResults = await this.crawlKeyword(keyword);
      results.push(...keywordResults);
    }

    return results;
  }

  private async crawlKeyword(keyword: string): Promise<PostResult[]> {
    const trimmedKeyword = keyword.trim();

    const platformPromises = [
      this.crawlPlatform('reddit', trimmedKeyword, () =>
        this.redditCrawler.searchPosts(trimmedKeyword)
      ),
      this.crawlPlatform('twitter', trimmedKeyword, () =>
        this.twitterCrawler.searchPosts(trimmedKeyword)
      ),
      this.crawlPlatform('linkedin', trimmedKeyword, () =>
        this.linkedInCrawler.searchPosts(trimmedKeyword)
      ),
    ];

    const results = await Promise.allSettled(platformPromises);

    return results
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          logger.error('Platform crawl failed:', result.reason);
          return null;
        }
      })
      .filter((result): result is PostResult => result !== null);
  }

  private async crawlPlatform(
    platform: 'reddit' | 'twitter' | 'linkedin',
    keyword: string,
    crawlFn: () => Promise<Post[]>
  ): Promise<PostResult> {
    try {
      const posts = await crawlFn();
      return {
        platform,
        keyword,
        posts,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error crawling ${platform} for "${keyword}": ${message}`);
      return {
        platform,
        keyword,
        posts: [],
        error: message,
      };
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
