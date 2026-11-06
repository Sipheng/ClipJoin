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

    let directUrl = null;

    // 1. Handle TikTok / Social Media Direct Matching or OEmbed API hooks
    if (url.includes('tiktok.com') || url.includes('instagram.com') || url.includes('fb.watch') || url.includes('facebook.com') || url.includes('youtu.be') || url.includes('youtube.com')) {
      
      // For YouTube / Social platforms, try a public oembed or direct page inspection fetch
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (response.ok) {
        const htmlText = await response.text();
        // Look for common meta property video streams or json payloads
        const socialPatterns = [
          /"playAddr"\s*:\s*"([^"]+)"/,
          /"videoUrl"\s*:\s*"([^"]+)"/,
          /property="og:video"\s+content="([^"]+)"/i,
          /property="og:video:secure_url"\s+content="([^"]+)"/i,
          /https:\/\/[^"'<>\s]+?\.(?:tiktokcdn\.com|mp4)[^"'<>\s]*/i
        ];

        for (const pattern of socialPatterns) {
          const match = htmlText.match(pattern);
          if (match) {
            directUrl = (match[1] || match[0]).replace(/\\u002F/g, '/').replace(/\\/g, '');
            break;
          }
        }
      }

      // If direct regex on social page didn't catch it, fallback to checking if it's already a direct file link
      if (!directUrl && (url.includes('.mp4') || url.includes('.webm'))) {
        directUrl = url;
      }

    } else {
      // 2. Standard ReelFren / Watch Page Extraction (Your Original Logic)
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://reelfren.net/"
        }
      });

      if (response.ok) {
        const htmlText = await response.text();
        const patterns = [
          /https:\/\/[^"'<>\s]+?\.tiktokcdn\.com[^"'<>\s]*/i,
          /"playAddr"\s*:\s*"([^"]+)"/,
          /"videoUrl"\s*:\s*"([^"]+)"/,
          /https:\/\/[^"'<>\s]+\.mp4(?:\?[^"'<>\s]*)?/i
        ];

        for (const pattern of patterns) {
          const match = htmlText.match(pattern);
          if (match) {
            directUrl = (match[1] || match[0]).replace(/\\u002F/g, '/').replace(/\\/g, '');
            break;
          }
        }
      }
    }

    // Final fallback: if the input URL itself is a direct file link
    if (!directUrl && url.startsWith('http')) {
      directUrl = url;
    }

    if (directUrl) {
      return new Response(JSON.stringify({ success: true, directUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Could not extract stream from this social link. Ensure it's a public video URL." }), {
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
