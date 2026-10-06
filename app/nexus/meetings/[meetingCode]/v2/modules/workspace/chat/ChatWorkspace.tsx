"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";

export type MeetingChatMessage = {
  id: string;
  sender: string;
  role: string;
  time: string;
  language: string;
  body: string;
};

export type ChatWorkspaceProps = {
  meetingChatMessages: MeetingChatMessage[];
  chatDraft: string;
  setChatDraft: Dispatch<SetStateAction<string>>;
  expandedChatMessageIds: Set<string>;
  sendMeetingChatMessage: () => void;
  toggleExpandedChatMessage: (
    messageId: string
  ) => void;
  chatQuickAction: (
    action: string
  ) => void;
  chatLanguageLabel: (
    message: MeetingChatMessage
  ) => string;
};

export default function ChatWorkspace({
  meetingChatMessages,
  chatDraft,
  setChatDraft,
  expandedChatMessageIds,
  sendMeetingChatMessage,
  toggleExpandedChatMessage,
  chatQuickAction,
  chatLanguageLabel,
}: ChatWorkspaceProps) {
  return (
    <section className="grid h-[clamp(300px,36vh,420px)] min-h-0 grid-cols-1 overflow-hidden">
      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
        <div className="flex shrink-0 items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Shared chat
            </div>

            <h3 className="mt-1 text-lg font-black">
              Meeting Chat
            </h3>
          </div>

          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-300">
            Live
          </span>
        </div>

        <div className="nexus-muted-scrollbar mt-3 min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
          {!meetingChatMessages.length ? (
            <div className="grid h-full min-h-36 place-items-center px-6 text-center">
              <div>
                <div className="text-2xl">
                  💬
                </div>

                <div className="mt-2 text-sm font-black text-slate-200">
                  No meeting messages yet
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Start the conversation. Shared messages will appear here
                  for everyone connected to this meeting.
                </p>
              </div>
            </div>
          ) : null}

          {meetingChatMessages.map((message) => {
            const messageId = String(message.id);

            const messageExpanded =
              expandedChatMessageIds.has(
                messageId
              );

            const messageBody = String(
              message.body || ""
            );

            const messageIsLong =
              messageBody.length > 420;

            return (
              <article
                key={message.id}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">
                      {message.sender}
                    </div>

                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {message.role} ·{" "}
                      {chatLanguageLabel(
                        message
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-500">
                    {message.time}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-5 text-slate-300">
                  {messageExpanded ||
                  !messageIsLong
                    ? messageBody
                    : `${messageBody
                        .slice(0, 420)
                        .trim()}…`}
                </p>

                {messageIsLong ? (
                  <button
                    type="button"
                    onClick={() =>
                      toggleExpandedChatMessage(
                        messageId
                      )
                    }
                    className="mt-2 text-[11px] font-black text-cyan-300 transition hover:text-cyan-100"
                  >
                    {messageExpanded
                      ? "Show less"
                      : "Show more"}
                  </button>
                ) : null}

                <div className="mt-2 flex gap-2 text-[10px] opacity-70 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() =>
                      chatQuickAction(
                        `${message.sender} message pinned`
                      )
                    }
                    className="rounded-lg border border-white/10 px-2 py-1.5 font-black"
                  >
                    Pin
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      chatQuickAction(
                        `${message.sender} message sent to notes`
                      )
                    }
                    className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1.5 font-black text-cyan-100"
                  >
                    To notes
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="relative z-20 mt-2 flex min-w-0 shrink-0 gap-2 border-t border-white/10 bg-[#07111c] pt-3">
          <input
            id="nexus-meeting-chat-input"
            value={chatDraft}
            onChange={(event) =>
              setChatDraft(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                sendMeetingChatMessage();
              }
            }}
            placeholder="Write to meeting chat..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-300/40"
          />

          <button
            type="button"
            onClick={
              sendMeetingChatMessage
            }
            disabled={!chatDraft.trim()}
            className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
