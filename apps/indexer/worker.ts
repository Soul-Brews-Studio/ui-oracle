interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const HELP = {
  error: "API not available on deployed indexer",
  message:
    "indexer.buildwithoracle.com is the indexer UI — run the backend locally via " +
    "`bunx --bun arra-oracle-v3@github:Soul-Brews-Studio/arra-oracle-v3`, " +
    "default localhost:47778, set ?host= to override.",
  docs: "https://neo.buildwithoracle.com/install/",
};

// Hashed by Vite — safe to cache forever. Covers /assets/* and *-[hash].{js,css,png,woff2,...}
const HASHED_ASSET = /\/(?:assets\/|[^/]+-)[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      return Response.json(HELP, {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (!response.ok) return response;

    const headers = new Headers(response.headers);

    if (HASHED_ASSET.test(url.pathname)) {
      headers.set("cache-control", "public, max-age=31536000, immutable");
    } else {
      headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
