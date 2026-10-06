"use client";

import type {
  ChangeEvent,
} from "react";

export type MeetingAssetKind =
  | "presentation"
  | "doc"
  | "spreadsheet"
  | "image"
  | "video"
  | "";

export type FilesWorkspaceProps = {
  meetingAssetKind: MeetingAssetKind;
  meetingAssetName: string;
  handleMeetingAssetUpload: (
    kind: Exclude<MeetingAssetKind, "">,
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

const FILE_TYPES: Array<{
  kind: Exclude<MeetingAssetKind, "">;
  label: string;
  icon: string;
  accept: string;
}> = [
  {
    kind: "presentation",
    label: "Presentation",
    icon: "📊",
    accept: ".ppt,.pptx",
  },
  {
    kind: "doc",
    label: "PDF / Docs",
    icon: "📄",
    accept: ".pdf,.doc,.docx",
  },
  {
    kind: "spreadsheet",
    label: "Spreadsheet",
    icon: "📈",
    accept: ".xls,.xlsx,.csv",
  },
  {
    kind: "image",
    label: "Images",
    icon: "🖼️",
    accept: "image/*",
  },
  {
    kind: "video",
    label: "Videos",
    icon: "🎬",
    accept: "video/*",
  },
];

export default function FilesWorkspace({
  meetingAssetKind,
  meetingAssetName,
  handleMeetingAssetUpload,
}: FilesWorkspaceProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-semibold">
        Shared Assets
      </div>

      <p className="mt-2 text-sm text-slate-400">
        Upload meeting documents, slides, spreadsheets,
        images, and videos into the presentation stage.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-5">
        {FILE_TYPES.map((item) => {
          const active =
            meetingAssetKind === item.kind;

          return (
            <label
              key={item.kind}
              className={`cursor-pointer rounded-2xl border p-5 text-center transition hover:border-cyan-300/50 hover:bg-cyan-300/10 ${
                active
                  ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-[#050b12]/[0.05]"
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept={item.accept}
                onChange={(event) =>
                  handleMeetingAssetUpload(
                    item.kind,
                    event
                  )
                }
              />

              <div className="text-3xl">
                {item.icon}
              </div>

              <div className="mt-3 font-semibold">
                {item.label}
              </div>
            </label>
          );
        })}
      </div>

      {meetingAssetName ? (
        <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100">
          Active asset: {meetingAssetName}
        </div>
      ) : null}
    </div>
  );
}
