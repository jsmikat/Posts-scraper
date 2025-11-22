import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  api: {
    rapidApi: {
      key: string;
      hosts: {
        reddit: string;
        twitter: string;
        linkedin: string;
      };
    };
  };
  crawl: {
    maxPostsPerKeyword: number;
    requestTimeout: number;
    enableCaching: boolean;
    cacheTTL: number;
    batchDelay: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  api: {
    rapidApi: {
      key: process.env.RAPIDAPI_KEY || '',
      hosts: {
        reddit: 'reddit34.p.rapidapi.com',
        twitter: 'twitter241.p.rapidapi.com',
        linkedin: 'linkedin-data-api.p.rapidapi.com',
      },
    },
  },
  crawl: {
    maxPostsPerKeyword: parseInt(process.env.MAX_POSTS_PER_KEYWORD || '10', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheTTL: parseInt(process.env.CACHE_TTL || '300000', 10),
    batchDelay: parseInt(process.env.BATCH_DELAY || '100', 10),
  },
};

export default config;
