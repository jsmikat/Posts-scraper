import config from '../config';
import { Post, TwitterApiResponse, TwitterTimelineEntry } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class TwitterCrawler extends CrawlerClient {
  private readonly PLATFORM = 'Twitter';

  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `twitter:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.fetchTwitterPosts(keyword);
        const posts = this.transformTwitterPosts(response);

        logger.info(`Fetched ${posts.length} posts from ${this.PLATFORM} for keyword: ${keyword}`);
        return posts;
      });
    } catch (error: unknown) {
      return this.handleError(error, keyword);
    }
  }

  private async fetchTwitterPosts(keyword: string): Promise<TwitterApiResponse> {
    const response = await this.client.get<TwitterApiResponse>(
      'https://twitter241.p.rapidapi.com/search-v2',
      {
        params: {
          type: 'Top',
          count: config.crawl.maxPostsPerKeyword.toString(),
          query: keyword,
        },
        headers: {
          'x-rapidapi-key': config.api.rapidApi.key,
          'x-rapidapi-host': config.api.rapidApi.hosts.twitter,
        },
      }
    );

    return response.data;
  }

  private transformTwitterPosts(apiResponse: TwitterApiResponse): Post[] {
    const instructions = apiResponse.result?.timeline?.instructions || [];
    const entries = instructions[0]?.entries || [];

    return entries
      .filter((entry) => this.isValidTweet(entry))
      .map((entry) => this.transformSinglePost(entry))
      .slice(0, config.crawl.maxPostsPerKeyword);
  }

  private isValidTweet(entry: TwitterTimelineEntry): boolean {
    const type = entry.content?.__typename;
    const tweetData = entry.content?.content?.tweetResult?.result;
    return type === 'TimelineTimelineItem' && !!tweetData;
  }

  private transformSinglePost(entry: TwitterTimelineEntry): Post {
    const result = entry.content.content!.tweetResult!.result!;
    const tweet = result.legacy;
    const user = result.core.user_result.result.legacy;
    const views = result.view_count_info?.count ? parseInt(result.view_count_info.count, 10) : 0;

    return {
      id: tweet.id_str,
      content: tweet.full_text,
      author: user.screen_name,
      url: `https://twitter.com/${user.screen_name}/status/${tweet.id_str}`,
      createdAt: new Date(tweet.created_at).toISOString(),
      engagement: {
        likes: tweet.favorite_count || 0,
        comments: tweet.reply_count || 0,
        shares: tweet.retweet_count || 0,
        views,
      },
    };
  }

  private handleError(error: unknown, keyword: string): Post[] {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${this.PLATFORM} crawl failed for keyword "${keyword}": ${message}`);
    return [];
  }
}
