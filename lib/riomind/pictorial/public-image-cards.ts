export type NexusPublicImageCard = {
  id?: string;
  title: string;
  imageUrl: string;
  sourceName?: string;
  sourceUrl?: string;
  caption?: string;
  alt?: string;
  kind?: "person" | "landmark" | "artwork" | "logo" | "product" | "animal" | "place" | "event" | "general";
};

function cleanTopic(input: string) {
  return String(input || "")
    .replace(/\b(show|give|display|present|find|get)\s+(me\s+)?/gi, "")
    .replace(/\b(pictures?|photos?|images?|image cards?|visual cards?|pictorial cards?|pictorial context|visual context)\s+(of|for|about)?\s*/gi, "")
    .replace(/\b(who is|what is|tell me about|explain|describe|show pictorial context|show visual context)\s+/gi, "")
    .replace(/[?.!]+$/g, "")
    .trim();
}

export function shouldUsePublicPictorialCards(message: string) {
  const text = String(message || "").toLowerCase();

  if (
    /\b(attached|uploaded|this)\s+(image|photo|picture|screenshot|file)\b/i.test(text) ||
    /\bfile name:|visual image attachment:|readable file content preview:/i.test(text)
  ) {
    return false;
  }

  return /\b(image card|pictorial|show.*image|show.*picture|show.*photo|picture of|photo of|image of|who is|what is|landmark|famous picture|famous image|painting|logo|icon|flag|animal|product)\b/i.test(text);
}

function inferKind(topic: string): NexusPublicImageCard["kind"] {
  const lower = topic.toLowerCase();

  if (/\b(tower|bridge|monument|landmark|museum|palace|temple|cathedral|mountain|city|country)\b/.test(lower)) return "landmark";
  if (/\b(logo|icon|symbol|flag)\b/.test(lower)) return "logo";
  if (/\b(painting|artwork|portrait|mona lisa|starry night)\b/.test(lower)) return "artwork";
  if (/\b(cat|dog|lion|tiger|elephant|eagle|animal|bird|fish)\b/.test(lower)) return "animal";
  if (/\b(phone|laptop|car|product|device|shoe|watch)\b/.test(lower)) return "product";

  return "general";
}


function getCuratedPublicImageCards(topic: string): NexusPublicImageCard[] {
  const lower = topic.toLowerCase().replace(/\s+/g, " ").trim();

  const cards: Record<string, NexusPublicImageCard> = {
    "donald trump": {
      id: "curated:wikimedia:donald-trump",
      title: "Donald Trump",
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Donald_Trump_official_portrait.jpg",
      sourceName: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Donald_Trump_official_portrait.jpg",
      caption: "Public Wikimedia image card for Donald Trump. This card is provided as sourced pictorial context for a public knowledge query.",
      alt: "Donald Trump official portrait",
      kind: "person",
    },
    "eiffel tower": {
      id: "curated:wikimedia:eiffel-tower",
      title: "Eiffel Tower",
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Eiffel_Tower_from_the_Tour_Montparnasse_3%2C_Paris_May_2014.jpg",
      sourceName: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Eiffel_Tower_from_the_Tour_Montparnasse_3,_Paris_May_2014.jpg",
      caption: "Public Wikimedia image card for the Eiffel Tower in Paris.",
      alt: "Eiffel Tower in Paris",
      kind: "landmark",
    },
    "mona lisa": {
      id: "curated:wikimedia:mona-lisa",
      title: "Mona Lisa",
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
      sourceName: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg",
      caption: "Public Wikimedia image card for Leonardo da Vinci's Mona Lisa.",
      alt: "Mona Lisa by Leonardo da Vinci",
      kind: "artwork",
    },
  };

  for (const [key, card] of Object.entries(cards)) {
    if (lower.includes(key)) return [card];
  }

  return [];
}


async function findWikipediaTitle(topic: string) {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: topic,
    format: "json",
    utf8: "1",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      "User-Agent": "RioMindNexus/1.0 pictorial-card-provider",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const title = data?.query?.search?.[0]?.title;

  return typeof title === "string" && title.trim() ? title.trim() : null;
}

async function fetchWikipediaSummary(title: string) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      headers: {
        "User-Agent": "RioMindNexus/1.0 pictorial-card-provider",
      },
      next: { revalidate: 60 * 60 * 24 },
    }
  );

  if (!res.ok) return null;

  return res.json().catch(() => null);
}

export async function getPublicPictorialCards(message: string): Promise<NexusPublicImageCard[]> {
  if (!shouldUsePublicPictorialCards(message)) return [];

  const topic = cleanTopic(message);
  if (!topic || topic.length < 2) return [];

  const curatedFallback = getCuratedPublicImageCards(topic);

  if (curatedFallback.length > 0) {
    return curatedFallback;
  }

  try {
    const title = await findWikipediaTitle(topic);
    if (!title) return curatedFallback;

    const summary = await fetchWikipediaSummary(title);
    if (!summary) return curatedFallback;

    const imageUrl =
      typeof summary?.originalimage?.source === "string"
        ? summary.originalimage.source
        : typeof summary?.thumbnail?.source === "string"
          ? summary.thumbnail.source
          : null;

    if (!imageUrl) return curatedFallback;

    const pageUrl =
      typeof summary?.content_urls?.desktop?.page === "string"
        ? summary.content_urls.desktop.page
        : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;

    return [
      {
        id: `wikipedia:${title}`,
        title: summary?.title || title,
        imageUrl,
        sourceName: "Wikipedia / Wikimedia",
        sourceUrl: pageUrl,
        caption: typeof summary?.extract === "string" ? summary.extract : undefined,
        alt: summary?.title || title,
        kind: inferKind(topic),
      },
    ];
  } catch {
    return curatedFallback;
  }
}
