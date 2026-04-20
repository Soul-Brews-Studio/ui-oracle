interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const HASHED_ASSET = /\/(?:assets\/|[^/]+-)[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i;

const STATUS_UPSTREAM = "http://76.13.221.42/maw/pulse/status.json";
const STATUS_CACHE_TTL_SECONDS = 60;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/status" || url.pathname === "/api/ping") {
      return handleStatus(url.pathname === "/api/ping");
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

async function handleStatus(pingOnly: boolean): Promise<Response> {
  try {
    const upstream = await fetch(STATUS_UPSTREAM, {
      signal: AbortSignal.timeout(5000),
      cf: { cacheTtl: STATUS_CACHE_TTL_SECONDS, cacheEverything: true },
    });
    if (!upstream.ok) {
      return json({ error: `upstream ${upstream.status}` }, 502);
    }
    if (pingOnly) return json({ ok: true }, 200);
    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${STATUS_CACHE_TTL_SECONDS}, stale-while-revalidate=300`,
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
