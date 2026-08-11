const TAVILY_EXTRACT_URL = 'https://api.tavily.com/extract';

export function createTavilyExtractClient({ apiKey, fetchImpl = fetch, timeoutMs = 15000 }) {
  async function extractUrls(urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(TAVILY_EXTRACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ urls, extract_depth: 'basic', include_usage: true }),
        signal: controller.signal
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Tavily Extract retornou HTTP ${response.status}: ${body.slice(0, 500)}`);
      }
      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  return { extractUrls };
}
