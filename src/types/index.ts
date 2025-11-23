export interface CrawlRequest {
  keywords: string[];
}

export interface PostResult {
  platform: 'reddit' | 'twitter' | 'linkedin';
  keyword: string;
  posts: Post[];
  error?: string;
}

export interface Post {
  id: string;
  title?: string;
  content: string;
  author: string;
  url: string;
  createdAt: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    ratio?: number;
    views?: number;
  };
}

export interface CrawlResponse {
  success: boolean;
  timestamp: string;
  results: PostResult[];
  summary: {
    totalKeywords: number;
    totalPosts: number;
    platformsQueried: string[];
  };
}

export interface ApiError {
  success: false;
  error: string;
  timestamp: string;
}

export interface LinkedInAuthor {
  fullName: string;
  headline: string;
  username: string;
  url: string;
}

export interface LinkedInEngagement {
  numComments: number;
  likeCount: number;
  totalReactionCount: number;
}

export interface LinkedInPostItem {
  urn: string;
  url: string;
  text: string;
  postedDate: string;
  postedDateTimestamp: number;
  author: LinkedInAuthor;
  socialActivityCountsInsight: LinkedInEngagement;
}

export interface LinkedInApiResponse {
  success: boolean;
  data: {
    total: number;
    count: number;
    items: LinkedInPostItem[];
  };
}

export interface RedditPostData {
  id: string;
  author: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  ups: number;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  view_count: number | null;
  created_utc: number;
}

export interface RedditPostWrapper {
  kind: string;
  data: RedditPostData;
}

export interface RedditApiResponse {
  success: boolean;
  data: {
    cursor: string;
    posts: RedditPostWrapper[];
  };
}

export interface XLegacy {
  full_text: string;
  created_at: string;
  favorite_count: number;
  reply_count: number;
  retweet_count: number;
  quote_count: number;
  id_str: string;
}

export interface XUserLegacy {
  screen_name: string;
  name: string;
  followers_count: number;
}

export interface TweetResult {
  __typename: 'Tweet';
  rest_id: string;
  legacy: XLegacy;
  core: {
    user_results: {
      result: {
        legacy: XUserLegacy;
      };
    };
  };
  views?: {
    count: string;
  };
}

export interface XEntry {
  entryId: string;
  content: {
    entryType: string;
    itemContent?: {
      tweet_results?: {
        result?: TweetResult;
      };
    };
  };
}

export interface XApiResponse {
  result: {
    timeline: {
      instructions: Array<{
        entries: XEntry[];
      }>;
    };
  };
}
