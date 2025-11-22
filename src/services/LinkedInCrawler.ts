import config from '../config';
import { Post } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class LinkedInCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `linkedin:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.client.get(
          'https://linkedin-api-data.p.rapidapi.com/post/search',
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

        interface LinkedInPost {
          urn?: string;
          id?: string;
          title?: string;
          headline?: string;
          text?: string;
          commentary?: { text?: string };
          content?: string;
          description?: string;
          author?: { name?: string };
          actorName?: string;
          user?: { name?: string };
          url?: string;
          shareUrl?: string;
          createdAt?: string | number;
          numLikes?: number;
          numComments?: number;
          numShares?: number;
          socialDetail?: {
            totalSocialActivityCounts?: {
              numLikes?: number;
              numComments?: number;
              numShares?: number;
            };
          };
        }

        const posts: Post[] = (response.data.data || response.data || []).map(
          (post: LinkedInPost) => ({
            id: post.urn || post.id || `linkedin-${Date.now()}-${Math.random()}`,
            title: post.title || post.headline,
            content: post.text || post.commentary?.text || post.content || post.description || '',
            author: post.author?.name || post.actorName || post.user?.name || 'LinkedIn User',
            url:
              post.url ||
              post.shareUrl ||
              `https://www.linkedin.com/feed/update/${post.urn || post.id}`,
            createdAt: post.createdAt
              ? new Date(post.createdAt).toISOString()
              : new Date().toISOString(),
            engagement: {
              likes: post.numLikes || post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
              comments:
                post.numComments || post.socialDetail?.totalSocialActivityCounts?.numComments || 0,
              shares:
                post.numShares || post.socialDetail?.totalSocialActivityCounts?.numShares || 0,
            },
          })
        );

        logger.info(`Fetched ${posts.length} posts from LinkedIn for keyword: ${keyword}`);
        return posts;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`LinkedIn crawl failed for keyword "${keyword}": ${message}`);
      return [];
    }
  }
}
