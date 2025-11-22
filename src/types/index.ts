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
