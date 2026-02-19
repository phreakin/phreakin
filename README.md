# Media Pulse Dashboard

A lightweight dashboard that aggregates RSS feeds for music, TV, movies, and pop culture into a single view. The server uses a simple Node.js HTTP server and relies on the public `rss2json` gateway to normalize RSS feeds without extra dependencies.

## Features
- Curated feeds from trusted entertainment publications.
- Category chips and keyword search to quickly filter stories.
- Manual refresh and auto timestamp for the latest fetch.
- Minimal styling geared toward a media-focused control center.

## Getting started
1. Ensure you have Node.js 18+ installed.
2. Install dependencies (none required beyond Node itself).
3. Start the server:
   ```bash
   node server.js
   ```
4. Open the dashboard at `http://localhost:3000`.

## How it works
- The `/api/feeds` endpoint fetches RSS feeds via `https://api.rss2json.com` and caches combined results for 15 minutes to reduce network requests.
- The front-end filters items by category or keyword and links directly to the original articles.

## Adding feeds
Update the `feedSources` array in `server.js` with new sources following the existing structure of `category`, `name`, and `url`.
