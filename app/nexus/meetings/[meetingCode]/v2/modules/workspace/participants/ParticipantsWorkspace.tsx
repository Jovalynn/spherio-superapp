"use client";

export type ParticipantsWorkspaceProps = {
  activeParticipants: any[];
  visibleParticipants: any[];
  humanParticipantCount: number;
  listenLanguage: string;
  languageLabel: (code: string) => string;
};

export default function ParticipantsWorkspace({
  activeParticipants,
  visibleParticipants,
  humanParticipantCount,
  listenLanguage,
  languageLabel,
}: ParticipantsWorkspaceProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-semibold">
        Participants
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Participant backend state, roles, language,
        and speaker/listener status.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {activeParticipants.length ? (
          visibleParticipants.map(
            (participant: any, index: number) => {
              const name =
                participant.name ||
                participant.display_name ||
                participant.participant_name ||
                participant.email ||
                `Guest ${index + 1}`;

              return (
                <div
                  key={
                    participant.id ||
                    participant.runtime_id ||
                    name
                  }
                  className="rounded-xl border border-white/10 bg-[#050b12]/[0.04] p-3"
                >
                  <div className="font-semibold">
                    {name}
                  </div>

                  <div className="text-xs text-slate-400">
                    {participant.role ||
                      participant.participant_role ||
                      "Participant"}
                  </div>

                  <div className="mt-2 text-xs text-cyan-200">
                    Listening:{" "}
                    {languageLabel(
                      participant.listening_language ||
                        participant.preferred_language ||
                        listenLanguage
                    )}
                  </div>
                </div>
              );
            }
          )
        ) : (
          <p className="text-sm text-slate-400">
            {humanParticipantCount} participants connected.
            Open People to manage presence, language,
            speaking, and roles.
          </p>
        )}
      </div>
    </div>
  );
}
