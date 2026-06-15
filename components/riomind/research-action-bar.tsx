"use client";

type Props = {
  onPdf?: () => void;
  onExcel?: () => void;
  onPpt?: () => void;
  onSaveMemory?: () => void;
  onPin?: () => void;
};

export default function ResearchActionBar({
  onPdf,
  onExcel,
  onPpt,
  onSaveMemory,
  onPin,
}: Props) {
  const btn =
    "rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.08] px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/[0.16]";

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button className={btn} onClick={onPdf}>📄 Create PDF</button>
      <button className={btn} onClick={onExcel}>📊 Create Excel</button>
      <button className={btn} onClick={onPpt}>📽 Create PowerPoint</button>
      <button className={btn} onClick={onSaveMemory}>🧠 Save to Project Memory</button>
      <button className={btn} onClick={onPin}>📌 Pin Research</button>
    </div>
  );
}
