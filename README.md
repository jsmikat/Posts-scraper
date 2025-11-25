# Posts Scraper

A TypeScript-based REST API for scraping and aggregating posts from multiple social media platforms including Reddit, X and LinkedIn.

## Project Structure

```
node-scraper/
├── src/
│   ├── config/
│   │   └── index.ts                # Application configuration
│   ├── controllers/
│   │   └── crawlController.ts      # Request handlers
│   ├── middleware/
│   │   ├── errorHandler.ts         # Error handling middleware
│   │   └── validation.ts           # Request validation
│   ├── services/
│   │   ├── CrawlerClient.ts        # Base crawler class
│   │   ├── CrawlerOrchestrator.ts  # Crawler orchestration
│   │   ├── LinkedInCrawler.ts      # LinkedIn implementation
│   │   ├── RedditCrawler.ts        # Reddit implementation
│   │   └── XCrawler.ts             # Twitter implementation
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── logger.ts               # Winston logger configuration
│   └── app.ts                      # Application entry point
├── public/
│   ├── index.html                  # Web interface
│   ├── styles.css                  # Stylesheet
│   └── app.js                      # Frontend logic
├── logs/                           # Application logs
├── .env                            # Environment variables
├── .env.sample                     # Environment template
├── package.json                    # Project dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Installation

1. Clone the repository

```bash
git clone https://github.com/jsmikat/Posts-scraper.git
cd Posts-scraper
```

2. Install dependencies

```bash
npm install
```

or

```bash
pnpm install
```

3. Configure environment variables

```bash
cp .env.sample .env
```

Edit `.env` and add your credentials:

```env
PORT=3000
LOG_LEVEL=info
RAPIDAPI_KEY=your_rapidapi_key_here
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

The server will start at `http://localhost:3000`

## API Endpoints

### POST /api/crawl

Search for posts across platforms.

**Request Body:**

```json
{
  "keywords": ["javascript", "typescript"]
}
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-11-22T10:30:00.000Z",
  "results": [
    {
      "platform": "reddit",
      "keyword": "javascript",
      "posts": [
        {
          "id": "abc123",
          "title": "Post title",
          "content": "Post content",
          "author": "username",
          "url": "https://reddit.com/...",
          "createdAt": "2025-11-22T10:00:00.000Z",
          "engagement": {
            "likes": 100,
            "comments": 25,
            "shares": 10,
            "views": 1000
          }
        }
      ]
    }
  ],
  "summary": {
    "totalKeywords": 1,
    "totalPosts": 30,
    "platformsQueried": ["reddit", "x", "linkedin"]
  }
}
```

## License

MIT