import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamPayload = Record<string, unknown>;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikeArtifactRequest(message: string) {
  const text = String(message || "").toLowerCase();

  return /\b(create|generate|make|prepare|export|download|build)\b[\s\S]{0,120}\b(excel|xlsx|spreadsheet|workbook|pdf|docx|word document|powerpoint|pptx|presentation|artifact|file)\b/.test(
    text
  );
}

function isFreshNewsQuestion(message: string) {
  return /\b(latest|current|today|now|recent|news|breaking|2024|2025|2026|sports|football|fintech|crypto|market|markets)\b/i.test(
    String(message || "")
  );
}

function splitIntoReadableChunks(text: string) {
  const tokens = String(text || "").match(/\S+\s*/g) ?? [];

  if (!tokens.length) {
    return [text];
  }

  return tokens;
}

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: StreamPayload
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  );
}

function sourceTrustLabel(source: any) {
  const text = `${source?.provider || ""} ${source?.url || ""}`.toLowerCase();

  if (/official|\.gov|\.edu|openai\.com|google\.com|microsoft\.com|apple\.com|spheriochain\.io/.test(text)) {
    return "🏛 Official Source";
  }

  if (/reuters|bloomberg|apnews|bbc|cnbc|financial times|ft\.com|wsj|associated press/.test(text)) {
    return "📰 Major News";
  }

  if (/yahoo|marketwatch|finnhub|polygon|alpha vantage|coingecko|coinmarketcap|businessline|financialpost/.test(text)) {
    return "📊 Market / Finance Source";
  }

  if (/hackernoon|medium|substack|reddit|forum/.test(text)) {
    return "⚠ Community / Blog Source";
  }

  return "📰 News Source";
}

function shortSnippet(value: any, max = 150) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

function cleanTopic(message: string) {
  return String(message || "this topic")
    .replace(/\b(latest|today|current|news|updates|recent|now)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "this topic";
}

function buildKeyFindings(citations: any[]) {
  const top = citations.slice(0, 4);

  if (!top.length) return "No strong source-backed findings were available.";

  return top.map((source: any, index: number) => {
    const title = String(source?.title || "Source update").replace(/\s+/g, " ").trim();
    const snippet = shortSnippet(source?.snippet, 110);
    return `${index + 1}. ${snippet || title}`;
  }).join("\n");
}

function marketSentiment(citations: any[]) {
  const text = citations.map((s) => `${s?.title || ""} ${s?.snippet || ""}`).join(" ").toLowerCase();

  const positive = ["gain", "gains", "launch", "growth", "funding", "expands", "wins", "rising", "partnership"];
  const negative = ["loss", "falls", "fraud", "scam", "risk", "decline", "lawsuit", "warning", "cuts"];

  const pos = positive.filter((word) => text.includes(word)).length;
  const neg = negative.filter((word) => text.includes(word)).length;

  if (pos > neg + 1) return "Positive";
  if (neg > pos + 1) return "Cautious";
  return "Neutral";
}

function buildExecutiveSummary(message: string, citations: any[]) {
  const topic = cleanTopic(message);
  const providers = [...new Set(citations.map((s) => s?.provider).filter(Boolean))].slice(0, 3);
  const sentiment = marketSentiment(citations);

  return [
    `## Executive Summary`,
    ``,
    `Nexus reviewed live sources for **${topic}** and selected the strongest ${Math.min(5, citations.length)} source-backed result${Math.min(5, citations.length) === 1 ? "" : "s"}.`,
    providers.length ? `Main coverage sources: ${providers.join(", ")}.` : `Coverage comes from current web/news sources.`,
    `Overall signal: ${sentiment}.`,
  ].join("\n");
}

function confidenceReason(confidence: string, citations: any[]) {
  const sourceCount = citations.length;
  const official = citations.filter((s) => /official|\.gov|\.edu|openai\.com|google\.com|microsoft\.com|apple\.com/i.test(`${s?.provider || ""} ${s?.url || ""}`)).length;
  const major = citations.filter((s) => /reuters|bloomberg|apnews|bbc|cnbc|ft\.com|wsj|financialpost|businessline|yahoo/i.test(`${s?.provider || ""} ${s?.url || ""}`)).length;

  return [
    `Confidence reason:`,
    `• ${sourceCount} live source${sourceCount === 1 ? "" : "s"} found`,
    `• ${major} major/news/market source${major === 1 ? "" : "s"} detected`,
    `• ${official} official source${official === 1 ? "" : "s"} detected`,
    `• Score: ${confidence}`,
  ].join("\n");
}

function buildStreamLiveSourceFallback(message: string, payload: any) {
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];

  if (!citations.length) return "";

  const freshness = payload?.freshness || {};
  const confidence = payload?.research?.confidence || payload?.research?.confidenceScore || "source-supported";

  const lines = [
    `${freshness.label || "🟢 Live Web Sources"} — updated ${freshness.updatedAt || "just now"}`,
    `Query time: ${payload?.queryStartedAt || ""}`,
    `Response time: ${payload?.responseCompletedAt || ""}`,
    `Thought duration: ${((Number(payload?.thoughtDurationMs || 0)) / 1000).toFixed(1)}s`,
    "",
    buildExecutiveSummary(message, citations),
    "",
    `## Key Findings`,
    "",
    buildKeyFindings(citations),
    "",
    `## Top Sources`,
    "",
    ...citations.slice(0, 5).map((source: any, index: number) => {
      return [
        `SOURCE_CARD_START`,
        `Index: ${index + 1}`,
        `Title: ${source.title || "Untitled source"}`,
        `Trust: ${sourceTrustLabel(source)}`,
        source.provider ? `Provider: ${source.provider}` : "",
        source.snippet ? `Summary: ${shortSnippet(source.snippet, 130)}` : "",
        source.url ? `Url: ${source.url}` : "",
        `SOURCE_CARD_END`,
      ].filter(Boolean).join("\n");
    }),
    "",
    `## Confidence`,
    "",
    `Score: ${confidence}`,
    confidenceReason(String(confidence), citations),
  ];

  return lines.join("\n");
}

async function fetchLiveStreamAnswer(origin: string, message: string) {
  const queryStartedAt = new Date();
  const thoughtStartedAt = Date.now();

  try {
    const liveRes = await fetch(`${origin}/api/riomind/sources/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        mode: "research",
      }),
      cache: "no-store",
    });

    const livePayload = await liveRes.json().catch(() => ({} as any));
    livePayload.queryStartedAt = queryStartedAt.toISOString();
    livePayload.responseCompletedAt = new Date().toISOString();
    livePayload.thoughtDurationMs = Date.now() - thoughtStartedAt;
    return buildStreamLiveSourceFallback(message, livePayload);
  } catch {
    return "";
  }
}

async function streamText(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  response: string,
  hasImageInputs: boolean
) {
  writeEvent(controller, encoder, "start", {
    ok: true,
    product: "RioMind Nexus",
  });

  for (const chunk of splitIntoReadableChunks(response)) {
    writeEvent(controller, encoder, "delta", { text: chunk });

    if (!hasImageInputs) {
      const pause = /[.!?]\s*$/.test(chunk)
        ? 95
        : /[,;:]\s*$/.test(chunk)
          ? 62
          : 24;

      await sleep(pause);
    }
  }

  writeEvent(controller, encoder, "done", {
    ok: true,
    product: "RioMind Nexus",
    response,
  });
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  let body: StreamPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const rawMessages = Array.isArray((body as any)?.messages) ? (body as any).messages : [];
  const lastMessage = rawMessages.length ? rawMessages[rawMessages.length - 1] : null;

  const message = String(
    body.message ||
      (body as any).content ||
      (body as any).input ||
      lastMessage?.content ||
      lastMessage?.message ||
      ""
  );

  body = {
    ...body,
    message,
  };

  const imageInputs = Array.isArray((body as any)?.imageInputs) ? (body as any).imageInputs : [];
  const hasImageInputs = imageInputs.length > 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        writeEvent(controller, encoder, "status", {
          product: "RioMind Nexus",
          status: "connected",
        });

        const origin = new URL(request.url).origin;

        if (isFreshNewsQuestion(message)) {
          writeEvent(controller, encoder, "status", {
            product: "RioMind Nexus",
            status: "thinking",
          });

          const liveAnswer = await fetchLiveStreamAnswer(origin, message);

          if (liveAnswer) {
            await streamText(controller, encoder, liveAnswer, hasImageInputs);
            controller.close();
            return;
          }
        }

        if (looksLikeArtifactRequest(message)) {
          writeEvent(controller, encoder, "fallback", {
            reason: "artifact_or_file_request",
            message: "This request should use the stable non-streaming artifact route.",
          });
          writeEvent(controller, encoder, "done", {
            ok: true,
            fallback: true,
          });
          controller.close();
          return;
        }

        writeEvent(controller, encoder, "status", {
          product: "RioMind Nexus",
          status: "thinking",
        });

        const res = await fetch(`${origin}/api/riomind/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-riomind-owner":
              request.headers.get("x-riomind-owner") ||
              request.headers.get("x-nexus-owner") ||
              "local_dev",
          },
          body: JSON.stringify({
            ...body,
            stream: false,
            streamMode: "text_only",
          }),
        });

        const data = await res.json().catch(() => ({} as any));
        const imageCards = Array.isArray(data?.imageCards) ? data.imageCards : [];

        if (!res.ok || data?.ok === false) {
          writeEvent(controller, encoder, "error", {
            error: data?.error || "chat_stream_failed",
          });
          controller.close();
          return;
        }

        if (data?.artifact) {
          writeEvent(controller, encoder, "fallback", {
            reason: "artifact_returned",
            message: "Artifact responses are handled by the stable non-streaming route.",
          });
          writeEvent(controller, encoder, "done", {
            ok: true,
            fallback: true,
          });
          controller.close();
          return;
        }

        const response =
          String(data?.response || "").trim() ||
          "RioMind Nexus completed the request, but no answer content was returned.";

        writeEvent(controller, encoder, "start", {
          ok: true,
          product: "RioMind Nexus",
        });

        if (imageCards.length > 0) {
          writeEvent(controller, encoder, "image_cards", {
            imageCards,
          });
        }

        for (const chunk of splitIntoReadableChunks(response)) {
          writeEvent(controller, encoder, "delta", {
            text: chunk,
          });

          if (!hasImageInputs) {
            const pause = /[.!?]\s*$/.test(chunk)
              ? 95
              : /[,;:]\s*$/.test(chunk)
                ? 62
                : 34;

            await sleep(pause);
          }
        }

        writeEvent(controller, encoder, "done", {
          ok: true,
          product: "RioMind Nexus",
          response,
          imageCards,
        });

        controller.close();
      } catch (error) {
        writeEvent(controller, encoder, "error", {
          error: error instanceof Error ? error.message : "chat_stream_failed",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
