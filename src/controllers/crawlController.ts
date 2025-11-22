import { Request, Response } from 'express';
import { CrawlerOrchestrator } from '../services/CrawlerOrchestrator';
import { CrawlRequest, CrawlResponse } from '../types';
import logger from '../utils/logger';

const crawlerOrchestrator = new CrawlerOrchestrator();

export const crawlPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keywords } = req.body as CrawlRequest;

    logger.info(`Received crawl request for ${keywords.length} keywords`, { keywords });

    const results = await crawlerOrchestrator.crawlPlatforms(keywords);

    const totalPosts = results.reduce((sum, result) => sum + result.posts.length, 0);
    const platformsQueried = [...new Set(results.map((r) => r.platform))];

    const response: CrawlResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalKeywords: keywords.length,
        totalPosts,
        platformsQueried,
      },
    };

    logger.info(
      `Crawl completed: ${totalPosts} posts found across ${platformsQueried.length} platforms`
    );

    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Crawl request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete crawl request',
      timestamp: new Date().toISOString(),
    });
  }
};
