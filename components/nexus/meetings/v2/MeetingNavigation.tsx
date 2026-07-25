"use client";

export type MeetingUtilityPanel =
  | "activity"
  | "teams"
  | "calls"
  | "apps"
  | null;

type MeetingNavigationProps = {
  meetingCode: string;
  appView: "meeting" | "calendar";
  activePanel: MeetingUtilityPanel;
  logoUrl: string;
  onPanelChange: (panel: MeetingUtilityPanel) => void;
};

const ITEMS = [
  ["📈", "Activity"],
  ["👥", "Teams"],
  ["📅", "Calendar"],
  ["📞", "Calls"],
  ["nexus-logo", "Nexus"],
  ["🚀", "Apps"],
] as const;

export default function MeetingNavigation({
  meetingCode,
  appView,
  activePanel,
  logoUrl,
  onPanelChange,
}: MeetingNavigationProps) {
  function isActive(item: string) {
    return (
      (item === "Activity" && activePanel === "activity") ||
      (item === "Teams" && activePanel === "teams") ||
      (item === "Calls" && activePanel === "calls") ||
      (item === "Apps" && activePanel === "apps") ||
      (item === "Calendar" && appView === "calendar")
    );
  }

  function openItem(item: string) {
    if (item === "Activity") {
      onPanelChange("activity");
      return;
    }

    if (item === "Teams") {
      onPanelChange("teams");
      return;
    }

    if (item === "Calls") {
      onPanelChange("calls");
      return;
    }

    if (item === "Apps") {
      onPanelChange("apps");
      return;
    }

    if (item === "Calendar") {
      window.location.href =
        `/nexus/meetings/${encodeURIComponent(meetingCode)}/calendar`;
      return;
    }

    if (item === "Nexus") {
      window.location.href = "/nexus";
    }
  }

  return (
    <aside className="border-r border-white/10 bg-black/30 px-3 py-5">
      <div className="mb-6 flex justify-center">
        <img
          src={logoUrl}
          alt="Nexus"
          className="h-12 w-12 rounded-2xl object-cover shadow-[0_0_30px_rgba(99,102,241,0.45)]"
        />
      </div>

      {ITEMS.map(([icon, item]) => (
        <button
          key={item}
          type="button"
          onClick={() => openItem(item)}
          className={`mb-5 block w-full rounded-2xl px-2 py-3 text-center text-xs transition ${
            isActive(item)
              ? "bg-indigo-500 text-white"
              : "text-slate-400 hover:bg-white/10"
          }`}
        >
          <div className="text-lg">●</div>
          {item}
        </button>
      ))}
    </aside>
  );
}
