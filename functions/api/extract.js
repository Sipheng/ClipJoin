export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { url } = body;
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "Missing video URL." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch target HTML with browser-like request headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: `Target server responded with HTTP status ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const htmlText = await response.text();

    // Comprehensive extraction patterns (ReelFren / TikTok CDN / HTML5 Video / JSON payloads)
    const patterns = [
      /https:\/\/[^"'<>\s]+?\.(?:tiktokcdn\.com|mp4)[^"'<>\s]*/i,
      /"playAddr"\s*:\s*"([^"]+)"/,
      /"videoUrl"\s*:\s*"([^"]+)"/,
      /src\s*=\s*["'](https:\/\/[^"']+\.mp4[^"']*)["']/i,
      /https:\/\/[^"'<>\s]+\.mp4(?:\?[^"'<>\s]*)?/i
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

    return new Response(JSON.stringify({ success: false, error: "Unable to extract direct MP4/CDN stream from this link." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: `Extraction error: ${err.message}` }), {
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