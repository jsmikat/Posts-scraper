import config from '../config';
import { Post } from '../types';
import logger from '../utils/logger';
import { CrawlerClient } from './CrawlerClient';

export class TwitterCrawler extends CrawlerClient {
  async searchPosts(keyword: string): Promise<Post[]> {
    const cacheKey = `twitter:${keyword}:${config.crawl.maxPostsPerKeyword}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const response = await this.client.get('https://twitter241.p.rapidapi.com/search-v2', {
          params: {
            type: 'Top',
            count: config.crawl.maxPostsPerKeyword.toString(),
            query: keyword,
          },
          headers: {
            'x-rapidapi-key': config.api.rapidApi.key,
            'x-rapidapi-host': config.api.rapidApi.hosts.twitter,
          },
        });

        interface TwitterEntry {
          content?: {
            itemContent?: {
              tweet_results?: {
                result?: {
                  legacy?: Record<string, unknown>;
                  core?: {
                    user_results?: {
                      result?: {
                        legacy?: Record<string, unknown>;
                      };
                    };
                  };
                };
              };
            };
          };
        }

        const results = response.data.result?.timeline?.instructions?.[0]?.entries || [];

        const posts: Post[] = results
          .filter((entry: TwitterEntry) => {
            const tweetResult = entry.content?.itemContent?.tweet_results?.result;
            return tweetResult && tweetResult.legacy;
          })
          .map((entry: TwitterEntry) => {
            const tweetResult = entry.content!.itemContent!.tweet_results!.result!;
            const tweet = tweetResult.legacy || {};
            const user = tweetResult.core?.user_results?.result?.legacy || {};

            return {
              id:
                tweet.id_str ||
                tweet.conversation_id_str ||
                `twitter-${Date.now()}-${Math.random()}`,
              content: tweet.full_text || tweet.text || '',
              author: user.screen_name || user.name || 'Twitter User',
              url:
                tweet.id_str && user.screen_name
                  ? `https://twitter.com/${user.screen_name}/status/${tweet.id_str}`
                  : `https://twitter.com/search?q=${encodeURIComponent(keyword)}`,
              createdAt: tweet.created_at || new Date().toISOString(),
              engagement: {
                likes: tweet.favorite_count || 0,
                comments: tweet.reply_count || 0,
                shares: tweet.retweet_count || 0,
              },
            };
          })
          .slice(0, config.crawl.maxPostsPerKeyword);

        logger.info(`Fetched ${posts.length} posts from Twitter for keyword: ${keyword}`);
        return posts;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Twitter crawl failed for keyword "${keyword}": ${message}`);
      return [];
    }
  }
}
