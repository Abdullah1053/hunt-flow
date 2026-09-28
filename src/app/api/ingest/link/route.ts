import { NextRequest, NextResponse } from 'next/server';
import { ExternalLink } from '@/types/ingestion';

export async function POST(req: NextRequest) {
  let rawUrl = '';
  try {
    const body = await req.json();
    rawUrl = typeof body?.url === 'string' ? body.url : '';
    const url = rawUrl;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format provided.' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HuntFlow/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Website returned status ${res.status}: ${res.statusText}` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Extract meta description
    const metaDescMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    // Strip scripts, styles, svg, and tags to obtain textual content
    const cleanBody = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract snippet
    const snippet = metaDescription
      ? `${metaDescription} — ${cleanBody.slice(0, 500)}...`
      : cleanBody.slice(0, 600);

    const linkItem: ExternalLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: parsedUrl.toString(),
      title,
      snippet,
      status: 'success',
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json({ link: linkItem });
  } catch (error) {
    console.warn('Link scraping warning:', error);
    // Return a graceful fallback link so the user's workflow is never interrupted
    const urlStr = rawUrl;
    let host = 'External Link';
    try {
      host = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`).hostname;
    } catch {
      // ignore
    }

    const fallbackLink: ExternalLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: urlStr,
      title: host,
      snippet: `External reference provided by candidate (${host}). Web crawler could not reach server.`,
      status: 'success',
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      link: fallbackLink,
      warning: error instanceof Error ? error.message : 'Could not fetch external page',
    });
  }
}
