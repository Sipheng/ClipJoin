export async function onRequestGet(context) {
  const urlParams = new URL(context.request.url).searchParams;
  const targetUrl = urlParams.get('url');

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!targetUrl) {
    return new Response("Missing URL parameter", { status: 400, headers: corsHeaders });
  }

  try {
    // Fetch from TikTok CDN using headers that satisfy anti-hotlinking checks
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.tiktok.com/",
        "Origin": "https://www.tiktok.com"
      }
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, { status: response.status, headers: corsHeaders });
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}