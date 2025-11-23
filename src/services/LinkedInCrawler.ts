import config from '../config';
import { LinkedInApiResponse, LinkedInPostItem, Post } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class LinkedInCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `linkedin:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.fetchLinkedInPosts(keyword);
        const posts = this.transformLinkedInPosts(response.data?.items || []);
        return posts;
      });
    } catch (error: unknown) {
      return this.handleError(error, keyword);
    }
  }

  private async fetchLinkedInPosts(keyword: string): Promise<LinkedInApiResponse> {
    const response = await this.client.get<LinkedInApiResponse>(
      'https://linkedin-data-api.p.rapidapi.com/search-posts',
      {
        params: {
          limit: config.crawl.maxPostsPerKeyword.toString(),
          offsite: '1',
          query: keyword,
        },
        headers: {
          'x-rapidapi-key': config.api.rapidApi.key,
          'x-rapidapi-host': config.api.rapidApi.hosts.linkedin,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  private transformLinkedInPosts(items: LinkedInPostItem[]): Post[] {
    return items.map((item) => this.transformSinglePost(item));
  }

  private transformSinglePost(item: LinkedInPostItem): Post {
    const engagement = item.socialActivityCountsInsight || {};
    const author = item.author.fullName || item.author.username || 'LinkedIn User';
    const title = `${item.author.fullName}: ${item.text.substring(0, 50)}...`;

    return {
      id: item.urn,
      title,
      content: item.text,
      author,
      url: item.url,
      createdAt: new Date(item.postedDateTimestamp).toISOString(),
      engagement: {
        likes: engagement.likeCount || engagement.totalReactionCount || 0,
        comments: engagement.numComments || 0,
        shares: 0,
      },
    };
  }

  private handleError(error: unknown, keyword: string): Post[] {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`LinkedIn crawl failed for keyword "${keyword}": ${message}`);
    return [];
  }
}
