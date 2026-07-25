
import { NextRequest, NextResponse } from "next/server";

import { detectFreshnessNeed } from "@/lib/riomind/freshness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveSource = {
  title: string;
  url: string;
  snippet: string;
  sourceType: "web" | "news" | "official";
  provider: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}


async function withTimeout<T>(label: string, task: Promise<T>, timeoutMs = 6500): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });

    const result = await Promise.race([task, timeout]);

    if (timer) clearTimeout(timer);

    return result as T | null;
  } catch {
    if (timer) clearTimeout(timer);
    return null;
  }
}

function flattenSourceResults(results: Array<LiveSource[] | null>) {
  return results.flatMap((item) => Array.isArray(item) ? item : []);
}

function officialDomainsFromText(text: string) {
  const matches = String(text || "").match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
  return [...new Set(matches)].slice(0, 5).map((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  });
}

async function searchBrave(query: string): Promise<LiveSource[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
    headers: {
      "Accept": "application/json",
      "X-Subscription-Token": key,
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const results = Array.isArray(data?.web?.results) ? data.web.results : [];

  return results.slice(0, 5).map((item: any) => ({
    title: clean(item.title),
    url: clean(item.url),
    snippet: clean(item.description),
    sourceType: "web",
    provider: "Brave Search",
  })).filter((item: LiveSource) => item.title && item.url);
}

async function searchNewsApi(query: string): Promise<LiveSource[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];

  const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=5&sortBy=publishedAt`, {
    headers: { "X-Api-Key": key },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];

  return articles.slice(0, 5).map((item: any) => ({
    title: clean(item.title),
    url: clean(item.url),
    snippet: clean(item.description || item.content),
    sourceType: "news",
    provider: clean(item.source?.name || "NewsAPI"),
  })).filter((item: LiveSource) => item.title && item.url);
}


async function searchMediaStack(query: string): Promise<LiveSource[]> {
  const key = process.env.MEDIASTACK_API_KEY;
  if (!key) return [];

  const response = await fetch(`http://api.mediastack.com/v1/news?access_key=${key}&keywords=${encodeURIComponent(query)}&limit=5&sort=published_desc`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const articles = Array.isArray(data?.data) ? data.data : [];

  return articles.slice(0, 5).map((item: any) => ({
    title: clean(item.title),
    url: clean(item.url),
    snippet: clean(item.description),
    sourceType: "news",
    provider: clean(item.source || "MediaStack"),
  })).filter((item: LiveSource) => item.title && item.url);
}

async function searchNewsData(query: string): Promise<LiveSource[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];

  const response = await fetch(`https://newsdata.io/api/1/news?apikey=${key}&q=${encodeURIComponent(query)}&language=en`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const articles = Array.isArray(data?.results) ? data.results : [];

  return articles.slice(0, 5).map((item: any) => ({
    title: clean(item.title),
    url: clean(item.link),
    snippet: clean(item.description),
    sourceType: "news",
    provider: clean(item.source_id || "NewsData"),
  })).filter((item: LiveSource) => item.title && item.url);
}

async function searchApiTube(query: string): Promise<LiveSource[]> {
  const key = process.env.APITUBE_API_KEY;
  if (!key) return [];

  const response = await fetch(`https://api.apitube.io/v1/news/everything?title=${encodeURIComponent(query)}&limit=5`, {
    headers: { "X-API-Key": key },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const articles = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [];

  return articles.slice(0, 5).map((item: any) => ({
    title: clean(item.title),
    url: clean(item.url || item.link),
    snippet: clean(item.description || item.summary),
    sourceType: "news",
    provider: clean(item.source?.name || item.source || "APITube"),
  })).filter((item: LiveSource) => item.title && item.url);
}

async function searchSportsDb(query: string): Promise<LiveSource[]> {
  const key = process.env.THESPORTSDB_API_KEY;
  if (!key) return [];

  const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${key}/searchteams.php?t=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  const teams = Array.isArray(data?.teams) ? data.teams : [];

  return teams.slice(0, 5).map((item: any) => ({
    title: clean(item.strTeam),
    url: clean(item.strWebsite ? `https://${String(item.strWebsite).replace(/^https?:\/\//, "")}` : item.strTeamBadge),
    snippet: clean(item.strDescriptionEN || `${item.strTeam} sports data from TheSportsDB.`),
    sourceType: "news",
    provider: "TheSportsDB",
  })).filter((item: LiveSource) => item.title && item.url);
}

async function fetchOfficialSources(urls: string[]): Promise<LiveSource[]> {
  const sources: LiveSource[] = [];

  for (const url of urls.slice(0, 5)) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "RioMindNexus/1.0",
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      const title =
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
          ?.replace(/<[^>]+>/g, " ")
          ?.replace(/\s+/g, " ")
          ?.trim() || url;

      const description =
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
          || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
          || "Official source fetched successfully.";

      sources.push({
        title: clean(title),
        url,
        snippet: clean(description),
        sourceType: "official",
        provider: "Official Website Fetcher",
      });
    } catch {
      continue;
    }
  }

  return sources;
}


function sourceTrustScore(source: LiveSource) {
  const host = (() => {
    try { return new URL(source.url).hostname.replace(/^www\./, "").toLowerCase(); }
    catch { return ""; }
  })();

  if (/openai\.com|google\.com|microsoft\.com|apple\.com|spheriochain\.io|gov|edu/.test(host)) return 30;
  if (/reuters|bloomberg|apnews|bbc|cnbc|ft\.com|wsj|forbes|techcrunch/.test(host)) return 25;
  if (/yahoo|financialpost|businessline|si\.com|coindesk|cointelegraph/.test(host)) return 18;
  if (source.sourceType === "official") return 24;
  if (source.sourceType === "news") return 14;
  return 8;
}

function sourceDomain(source: LiveSource) {
  try { return new URL(source.url).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return source.url || source.title; }
}

function rankAndDedupeSources(sources: LiveSource[]) {
  const ranked = [...sources]
    .filter((source) => source.title && source.url)
    .sort((a, b) => sourceTrustScore(b) - sourceTrustScore(a));

  const seen = new Set<string>();
  const unique: LiveSource[] = [];

  for (const source of ranked) {
    const key = sourceDomain(source);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }

  return unique.slice(0, 10);
}

function computeResearchConfidence(sources: LiveSource[]) {
  const countScore = Math.min(30, sources.length * 4);
  const trustScore = Math.min(40, Math.round(sources.reduce((sum, source) => sum + sourceTrustScore(source), 0) / Math.max(1, sources.length)));
  const recencyScore = 20;
  const diversityScore = Math.min(10, new Set(sources.map(sourceDomain)).size * 2);

  return Math.max(40, Math.min(98, countScore + trustScore + recencyScore + diversityScore));
}

function detectContradictions(sources: LiveSource[]) {
  // V1 lightweight placeholder: returns empty until semantic contradiction comparison is added.
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const startedAt = Date.now();
    const body = await request.json().catch(() => ({}));

    const query = clean(body.query);
    const requestedMode = clean(body.mode);
    const officialUrls = Array.isArray(body.officialUrls)
      ? body.officialUrls.map(clean).filter(Boolean)
      : officialDomainsFromText(query);

    if (!query) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "query_required" },
        { status: 400 }
      );
    }

    const freshness = detectFreshnessNeed(query);
    const mode = requestedMode || freshness.mode;

    const sourceTasks: Array<Promise<LiveSource[] | null>> = [];

    if (mode === "web" || mode === "research") {
      sourceTasks.push(withTimeout("brave", searchBrave(query), 5500));
    }

    if (mode === "news" || mode === "research") {
      sourceTasks.push(withTimeout("newsapi", searchNewsApi(query), 5500));
      sourceTasks.push(withTimeout("mediastack", searchMediaStack(query), 5500));
      sourceTasks.push(withTimeout("newsdata", searchNewsData(query), 5500));
      sourceTasks.push(withTimeout("apitube", searchApiTube(query), 5500));
    }

    if (/sport|football|soccer|basketball|tennis|cricket|nba|nfl|mlb|epl|champions league/i.test(query)) {
      sourceTasks.push(withTimeout("sportsdb", searchSportsDb(query), 4500));
    }

    if (mode === "official" || mode === "research") {
      sourceTasks.push(withTimeout("official", fetchOfficialSources(officialUrls), 6500));
    }

    const sources = flattenSourceResults(await Promise.all(sourceTasks));

    const uniqueSources = rankAndDedupeSources(sources);
    const confidenceScore = computeResearchConfidence(uniqueSources);
    const contradictions = detectContradictions(uniqueSources);

    const liveSourcesUsed = uniqueSources.length > 0;

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      freshness: {
        ...freshness,
        liveSourcesUsed,
        badge: liveSourcesUsed ? "live_sources" : "knowledge_only",
        label: liveSourcesUsed ? "🟢 Live Web Sources" : "🟡 Knowledge Only",
        updatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      citations: uniqueSources.map((source, index) => ({
        id: index + 1,
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        sourceType: source.sourceType,
        provider: source.provider,
      })),
      research: {
        summary: liveSourcesUsed
          ? `Found ${uniqueSources.length} live source(s) for this query.`
          : "No live source provider returned results. Add BRAVE_SEARCH_API_KEY and/or NEWS_API_KEY for live search.",
        contradictions,
        confidence: liveSourcesUsed ? `${confidenceScore}/100` : "knowledge_only",
        confidenceScore,
        references: uniqueSources.map((source) => source.url),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "live_sources_failed",
      },
      { status: 500 }
    );
  }
}
