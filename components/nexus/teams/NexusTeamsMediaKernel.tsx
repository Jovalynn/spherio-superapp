"use client";

type MediaKind =
  | "video"
  | "image"
  | "doc"
  | "spreadsheet"
  | "presentation"
  | "external"
  | "";

export type NexusTeamsMediaAsset = {
  kind: MediaKind;
  url: string;
  name: string;
  playbackType?: "file" | "embed" | "direct";
};

export function detectNexusMediaKind(fileName: string): MediaKind {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "presentation";
  if (lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "spreadsheet";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif")) return "image";
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg") || lower.endsWith(".mov")) return "video";

  return "doc";
}

export function normalizeNexusVideoUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      if (url.pathname.includes("/shorts/")) {
        const shortId = url.pathname.split("/shorts/")[1]?.split("/")[0];
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
      }

      if (url.pathname.includes("/embed/")) return rawUrl;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export function NexusTeamsMediaStage({
  asset,
  fallback,
}: {
  asset: NexusTeamsMediaAsset | null;
  fallback: React.ReactNode;
}) {
  if (!asset?.url) return <>{fallback}</>;

  const lower = asset.name.toLowerCase();

  if (asset.kind === "video" || asset.kind === "external") {
    const isEmbed = asset.playbackType === "embed" || asset.url.includes("youtube.com/embed/");

    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <div className="w-full max-w-5xl">
          <div className="mb-3 text-center text-sm font-semibold text-slate-700">
            Now playing: {asset.name}
          </div>

          {isEmbed ? (
            <iframe
              src={asset.url}
              title={asset.name}
              className="aspect-video w-full rounded-2xl border border-slate-200 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              src={asset.url}
              controls
              className="aspect-video w-full rounded-2xl border border-slate-200 bg-black"
            />
          )}
        </div>
      </div>
    );
  }

  if (asset.kind === "image") {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <img src={asset.url} alt={asset.name} className="max-h-[520px] rounded-2xl object-contain" />
      </div>
    );
  }

  if (asset.kind === "doc" && lower.endsWith(".pdf")) {
    return (
      <div className="w-full">
        <div className="mb-3 text-center text-sm font-semibold text-slate-700">
          PDF: {asset.name}
        </div>
        <iframe src={asset.url} title={asset.name} className="h-[560px] w-full rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (asset.kind === "presentation") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-xl">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-500">Nexus Teams Slideshow</div>
        <h3 className="mt-4 text-4xl font-black text-slate-950">{asset.name}</h3>
        <p className="mt-3 text-slate-600">Presentation loaded into the meeting stage. Slide extraction/rendering can be connected next.</p>
        <div className="mt-8 grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((slide) => (
            <div key={slide} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-700">
              Slide {slide}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (asset.kind === "spreadsheet") {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left text-slate-900">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">Spreadsheet Preview</div>
        <h3 className="mt-4 text-3xl font-black">{asset.name}</h3>
        <p className="mt-3 text-slate-600">Spreadsheet loaded into the meeting stage. Table extraction/rendering can be connected to the existing Nexus Excel pipeline next.</p>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-4 bg-slate-100 text-sm font-bold">
            {["Column A", "Column B", "Column C", "Column D"].map((h) => <div key={h} className="p-3">{h}</div>)}
          </div>
          {[1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-4 border-t border-slate-200 text-sm">
              {[1, 2, 3, 4].map((col) => <div key={col} className="p-3 text-slate-600">Preview {row}.{col}</div>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900">
      <h3 className="text-3xl font-black">{asset.name}</h3>
      <p className="mt-3 text-slate-600">File loaded into the meeting stage.</p>
    </div>
  );
}
