import config from '../config';
import { Post } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class RedditCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `reddit:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.client.get('https://reddit34.p.rapidapi.com/getSearchPosts', {
          params: {
            query: keyword,
          },
          headers: {
            'x-rapidapi-key': config.api.rapidApi.key,
            'x-rapidapi-host': config.api.rapidApi.hosts.reddit,
          },
        });

        interface RedditPost {
          id?: string;
          post_id?: string;
          title?: string;
          selftext?: string;
          text?: string;
          body?: string;
          author?: string;
          author_name?: string;
          url?: string;
          permalink?: string;
          created_utc?: number;
          created_at?: string;
          ups?: number;
          upvotes?: number;
          score?: number;
          num_comments?: number;
          comment_count?: number;
        }

        const posts: Post[] = (response.data.data?.posts || response.data.posts || [])
          .slice(0, config.crawl.maxPostsPerKeyword)
          .map((post: RedditPost) => ({
            id: post.id || post.post_id || `reddit-${Date.now()}-${Math.random()}`,
            title: post.title,
            content: post.selftext || post.text || post.body || post.title || '',
            author: post.author || post.author_name || 'Reddit User',
            url: post.url || post.permalink || `https://reddit.com${post.permalink || ''}`,
            createdAt: post.created_utc
              ? new Date(post.created_utc * 1000).toISOString()
              : post.created_at || new Date().toISOString(),
            engagement: {
              likes: post.ups || post.upvotes || post.score || 0,
              comments: post.num_comments || post.comment_count || 0,
            },
          }));

        logger.info(`Fetched ${posts.length} posts from Reddit for keyword: ${keyword}`);
        return posts;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Reddit crawl failed for keyword "${keyword}": ${message}`);
      return [];
    }
  }
}
