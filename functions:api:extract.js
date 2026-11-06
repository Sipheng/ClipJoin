export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { url } = await context.request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch target HTML mimicking a real browser user agent
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Target site returned HTTP status ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const htmlText = await response.text();

    // Check if the response accidentally gave a Cloudflare/security challenge page
    if (htmlText.includes("Just a moment...") || htmlText.includes("Checking your browser")) {
      return new Response(JSON.stringify({ error: "Target site has bot protection (Cloudflare challenge) blocking the request." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Flexible regex patterns to catch various direct video CDN sources
    const patterns = [
      /https:\/\/[^"'<>\s]+?\.(?:tiktokcdn\.com|mp4)[^"'<>\s]*/i,
      /"playAddr"\s*:\s*"([^"]+)"/,
      /"videoUrl"\s*:\s*"([^"]+)"/,
      /src\s*=\s*["'](https:\/\/[^"']+\.mp4[^"']*)["']/i
    ];

    let directUrl = null;
    for (const pattern of patterns) {
      const match = htmlText.match(pattern);
      if (match) {
        directUrl = (match[1] || match[0]).replace(/\\u002F/g, '/').replace(/\\/g, '');
        break;
      }
    }

    if (directUrl) {
      return new Response(JSON.stringify({ success: true, directUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "No valid video stream URL pattern matched on the page." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
