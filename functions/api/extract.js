export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { url } = await context.request.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "Missing URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://reelfren.net/"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: `Failed to load page (HTTP ${response.status})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const htmlText = await response.text();

    const patterns = [
      /https:\/\/[^"'<>\s]+?\.tiktokcdn\.com[^"'<>\s]*/i,
      /"playAddr"\s*:\s*"([^"]+)"/,
      /"videoUrl"\s*:\s*"([^"]+)"/,
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

    return new Response(JSON.stringify({ success: false, error: "Could not find video stream inside page source." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}