import config from '../config';
import { Post, RedditApiResponse, RedditPostWrapper } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class RedditCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `reddit:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.fetchRedditPosts(keyword);
        const posts = this.transformRedditPosts(response.data?.posts || []);
        return posts;
      });
    } catch (error: unknown) {
      return this.handleError(error, keyword);
    }
  }

  private async fetchRedditPosts(keyword: string): Promise<RedditApiResponse> {
    const response = await this.client.get<RedditApiResponse>(
      'https://reddit34.p.rapidapi.com/getSearchPosts',
      {
        params: {
          query: keyword,
        },
        headers: {
          'x-rapidapi-key': config.api.rapidApi.key,
          'x-rapidapi-host': config.api.rapidApi.hosts.reddit,
        },
      }
    );

    return response.data;
  }

  private transformRedditPosts(rawPosts: RedditPostWrapper[]): Post[] {
    return rawPosts
      .slice(0, config.crawl.maxPostsPerKeyword)
      .map((item) => this.transformSinglePost(item));
  }

  private transformSinglePost(item: RedditPostWrapper): Post {
    const post = item.data;

    return {
      id: post.id,
      title: post.title,
      content: post.selftext || post.title,
      author: post.author,
      url: post.url || `https://www.reddit.com${post.permalink}`,
      createdAt: new Date(post.created_utc * 1000).toISOString(),
      engagement: {
        likes: post.ups,
        comments: post.num_comments,
        ratio: post.upvote_ratio,
        views: post.view_count || 0,
      },
    };
  }

  private handleError(error: unknown, keyword: string): Post[] {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Reddit crawl failed for keyword "${keyword}": ${message}`);
    return [];
  }
}
