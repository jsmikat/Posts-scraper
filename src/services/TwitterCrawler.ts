import config from '../config';
import { Post, XApiResponse } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class XCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `x:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.client.get<XApiResponse>(
          'https://twitter241.p.rapidapi.com/search',
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

        const posts = this.transformXPosts(response.data);
        return posts;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`X crawl failed for keyword "${keyword}": ${message}`);
      return [];
    }
  }
  private transformXPosts(apiResponse: XApiResponse): Post[] {
    const instructions = apiResponse.result?.timeline?.instructions || [];

    const addEntries = instructions.find((i) => i.entries && i.entries.length > 0);
    const entries = addEntries?.entries || [];

    return entries
      .filter((entry) => {
        return (
          entry.content.entryType === 'TimelineTimelineItem' &&
          entry.content.itemContent?.tweet_results?.result?.__typename === 'Tweet'
        );
      })
      .map((entry) => {
        const result = entry.content.itemContent!.tweet_results!.result!;
        const tweetLegacy = result.legacy;
        const userLegacy = result.core.user_results.result.legacy;

        const views = result.views?.count ? parseInt(result.views.count, 10) : 0;

        return {
          id: tweetLegacy.id_str,
          content: tweetLegacy.full_text,
          author: userLegacy.screen_name,
          url: `https://twitter.com/${userLegacy.screen_name}/status/${tweetLegacy.id_str}`,
          createdAt: new Date(tweetLegacy.created_at).toISOString(),
          engagement: {
            likes: tweetLegacy.favorite_count || 0,
            comments: tweetLegacy.reply_count || 0,
            shares: tweetLegacy.retweet_count || 0,
            views: views,
          },
        };
      })
      .slice(0, config.crawl.maxPostsPerKeyword);
  }
}
