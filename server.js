const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const FEED_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const feedSources = [
  {
    category: 'Music',
    name: 'Rolling Stone - Music',
    url: 'https://www.rollingstone.com/music/music-news/feed/',
  },
  {
    category: 'Music',
    name: 'Pitchfork - News',
    url: 'https://pitchfork.com/rss/news/',
  },
  {
    category: 'TV',
    name: 'TVLine',
    url: 'https://tvline.com/feed/',
  },
  {
    category: 'Movies',
    name: 'SlashFilm',
    url: 'https://www.slashfilm.com/feed/',
  },
  {
    category: 'Movies',
    name: 'Collider',
    url: 'https://collider.com/feed/',
  },
  {
    category: 'Pop Culture',
    name: 'Variety',
    url: 'https://variety.com/feed/',
  },
  {
    category: 'Pop Culture',
    name: 'TMZ',
    url: 'https://www.tmz.com/rss.xml',
  },
  {
    category: 'Technology',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
  },
  {
    category: 'Technology',
    name: 'TechRadar',
    url: 'https://www.techradar.com/feeds.xml',
  },
  {
    "category": "Sports",
    "name": "ESPN",
    "url": "https://www.espn.com/espn/rss/news"
  },
  {
    "category": "Sports",
    "name": "Fox Sports",
    "url": "https://www.foxsports.com/feedout/syndicatedContent?categoryId=0&partnerId=87&tagId=0"
  },
  {
    "category": "Sports",
    "name": "ESPN NFL",
    "url": "https://www.espn.com/espn/rss/nfl/news?null"
  },
  {
    "category": "Sports",
    "name": "College Football",
    "url": "https://www.ncaa.com/news/football/fbs/rss.xml"
  },
  {
    "category": "World News",
    "name": "BBC News",
    "url": "https://feeds.bbci.co.uk/news/rss.xml"
  },
  {
    "category": "World News",
    "name": "CNN",
    "url": "https://rss.cnn.com/rss/cnn_topstories.rss"
  },
  {
    "category": "US News",
    "name": "Fox News",
    "url": "https://feeds.foxnews.com/foxnews/latest"
  },
  {
    "category": "World News",
    "name": "The Guardian",
    "url": "https://www.theguardian.com/world/rss"
  },
  {
    "category": "US News",
    "name": "Washington Post",
    "url": "https://www.washingtonpost.com/rss/national"
  },
  {
    "category": "US News",
    "name": "Google News",
    "url": "https://news.google.com/rss/search?q=headlines%20language:en"
  },
  {
    "category": "Youtube",
    "name": "YouTube",
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC-9-kyTW8ZkZNDHQJ6FgpwQ"
  },
  {
    "category": "Politics",
    "name": "CNN Politics",
    "url": "https://rss.cnn.com/rss/cnn_politics_latest.rss"
  },
  {
    "category": "Politics",
    "name": "Google News Reuters",
    "url": "https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen"
  },
  {
    "category": "Politics",
    "name": "Washington Post Politics",
    "url": "https://www.washingtonpost.com/arcio/rss/category/politics/?itid=lk_inline_manual_2"
  },
  {
    "category": "Streaming",
    "name": "HBO",
    "url": "https://www.hbo.com/rss/news"
  },
  {
    "category": "Streaming",
    "name": "Netflix",
    "url": "https://www.netflix.com/feed/topstories"
  },
  {
    "category": "Streaming",
    "name": "Amazon Prime Video",
    "url": "https://www.amazon.com/rss/video-on-demand"
  },
  {
    "category": "Podcast",
    "name": "Crime Junkie",
    "url": "https://feeds.simplecast.com/qm_9xx0g"
  },
  {
    "category": "Movies",
    "name": "Apple Top Movies",
    "url": "http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topMovies/xml"
  },
  {
    "category": "Streaming",
    "name": "CordCutters Hulu",
    "url": "https://cordcuttersnews.com/category/news/hulu/feed/"
  },
  {
    "category": "Podcasts",
    "name": "Joe Rogan Experience",
    "url": "https://media.rss.com/the-joe-rogan-experience-podcast-summary/feed.xml"
  },
  {
    "category": "Movies",
    "name": "Apple Movie Trailers",
    "url": "https://tv.apple.com/us/room/movie--tv-trailers/edt.item.64248313-7414-4d63-a6fc-7c29f9916c79"
  }
];

let cachedFeeds = null;
let cachedAt = 0;

async function fetchFeed(source) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.name}: ${response.status}`);
  }
  const json = await response.json();
  const items = (json.items || []).slice(0, 8).map((item) => ({
    title: item.title,
    link: item.link,
    published: item.pubDate,
    source: source.name,
    category: source.category,
    summary: item.description ? item.description.replace(/<[^>]+>/g, '').trim() : '',
  }));
  return items;
}

async function getAggregatedFeeds() {
  const now = Date.now();
  if (cachedFeeds && now - cachedAt < FEED_CACHE_DURATION) {
    return cachedFeeds;
  }

  const feedPromises = feedSources.map((source) =>
    fetchFeed(source).catch((error) => {
      console.error(error.message);
      return [];
    })
  );
  const results = await Promise.all(feedPromises);
  cachedFeeds = results.flat().sort((a, b) => new Date(b.published) - new Date(a.published));
  cachedAt = now;
  return cachedFeeds;
}

function sendJson(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

function serveStatic(req, res) {
  const parsedUrl = url.parse(req.url);
  const publicDir = path.join(__dirname, 'public');
  const sanitizedPath = path.normalize(parsedUrl.pathname).replace(/^\/+/, '');
  const requestedPath = path.resolve(path.join(publicDir, sanitizedPath));

  if (requestedPath !== publicDir && !requestedPath.startsWith(publicDir + path.sep)) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  let pathname = requestedPath;

  fs.stat(pathname, (err, stats) => {
    if (err || !stats.isFile()) {
      pathname = path.join(publicDir, 'index.html');
    }

    fs.readFile(pathname, (readErr, data) => {
      if (readErr) {
        sendError(res, 500, 'Server error');
        return;
      }
      const ext = path.parse(pathname).ext.toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      }[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/feeds')) {
    try {
      const feeds = await getAggregatedFeeds();
      sendJson(res, { items: feeds, lastUpdated: cachedAt });
    } catch (error) {
      sendError(res, 500, 'Unable to load feeds right now.');
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`RSS dashboard running at http://localhost:${PORT}`);
});
