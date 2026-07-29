"use client";

import { FormEvent, useMemo, useState } from "react";

export type NexusMeetingRecord = {
  id: string;
  team_id: string;
  room_id?: string | null;
  title: string;
  purpose?: string | null;
  organizer?: string | null;
  meeting_date?: string | null;
  meeting_time?: string | null;
  duration_minutes?: number | null;
  language_mode?: string | null;
  default_language?: string | null;
  meeting_status?: string | null;
  meeting_code: string;
  meeting_link?: string | null;
  invite_link?: string | null;
  meeting_type?: string | null;
  access_policy?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MeetingTeamOption = {
  id: string;
  name: string;
};

export type MeetingRoomOption = {
  id: string;
  name: string;
};

type CreateMeetingFormProps = {
  teamId?: string;
  teams?: MeetingTeamOption[];
  rooms?: MeetingRoomOption[];
  defaultRoomId?: string;
  defaultLanguage?: string;
  defaultLanguageMode?: "single" | "multi";
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultOrganizer?: string;
  defaultTitle?: string;
  defaultPurpose?: string;
  defaultMeetingType?: "scheduled" | "instant" | "personal" | "team_room";
  defaultAccessPolicy?: "private" | "team" | "invited" | "public";
  submitLabel?: string;
  onCreated?: (meeting: NexusMeetingRecord) => void | Promise<void>;
  onCancel?: () => void;
};

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "ar", label: "Arabic" },
  { code: "es", label: "Spanish" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
];

function durationBetween(start: string, end: string): number {
  if (!start || !end) return 60;

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 60;
  }

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return Math.max(15, endTotal - startTotal);
}

export default function CreateMeetingForm({
  teamId,
  teams = [],
  rooms = [],
  defaultRoomId = "",
  defaultLanguage = "en",
  defaultLanguageMode = "single",
  defaultDate = "",
  defaultStartTime = "",
  defaultEndTime = "",
  defaultOrganizer = "Organizer",
  defaultTitle = "Nexus Teams Meeting",
  defaultPurpose = "",
  defaultMeetingType = "scheduled",
  defaultAccessPolicy = "team",
  submitLabel = "Create Meeting + Invite Link",
  onCreated,
  onCancel,
}: CreateMeetingFormProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(
    teamId || teams[0]?.id || ""
  );
  const [title, setTitle] = useState(defaultTitle);
  const [organizer, setOrganizer] = useState(defaultOrganizer);
  const [purpose, setPurpose] = useState(defaultPurpose);
  const [meetingDate, setMeetingDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [meetingType, setMeetingType] = useState(defaultMeetingType);
  const [accessPolicy, setAccessPolicy] = useState(defaultAccessPolicy);
  const [languageMode, setLanguageMode] = useState(defaultLanguageMode);
  const [defaultLanguageCode, setDefaultLanguageCode] =
    useState(defaultLanguage);
  const [translationEnabled, setTranslationEnabled] = useState(
    defaultLanguageMode === "multi"
  );
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [lobbyEnabled, setLobbyEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdMeeting, setCreatedMeeting] =
    useState<NexusMeetingRecord | null>(null);

  const effectiveTeamId = teamId || selectedTeamId;

  const durationMinutes = useMemo(
    () => durationBetween(startTime, endTime),
    [startTime, endTime]
  );

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedMeeting(null);

    if (!effectiveTeamId) {
      setError("Select a team before creating the meeting.");
      return;
    }

    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }

    if (meetingType !== "instant" && !meetingDate) {
      setError("Meeting date is required for a scheduled meeting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/riomind/teams/${encodeURIComponent(effectiveTeamId)}/meetings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            purpose: purpose.trim() || null,
            organizer: organizer.trim() || "Organizer",
            ownerDisplayName: organizer.trim() || "Organizer",
            roomId: roomId || null,
            meetingDate:
              meetingType === "instant" ? null : meetingDate || null,
            meetingTime:
              meetingType === "instant" ? null : startTime || null,
            durationMinutes,
            languageMode:
              translationEnabled || languageMode === "multi"
                ? "multi"
                : "single",
            defaultLanguage: defaultLanguageCode,
            meetingType,
            accessPolicy,
            lobbyEnabled,
            metadata: {
              source: "shared-create-meeting-form",
              translationEnabled,
              recordingEnabled,
              scheduledEndTime: endTime || null,
            },
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.meeting) {
        throw new Error(payload?.error || "Failed to create meeting.");
      }

      const meeting = payload.meeting as NexusMeetingRecord;
      setCreatedMeeting(meeting);

      await onCreated?.(meeting);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create meeting."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitMeeting}
      className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">
          Create a Nexus Teams meeting
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          One meeting record, invite link, calendar entry, and meeting
          workspace.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {!teamId ? (
          <label className="text-xs text-slate-400">
            Team
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="text-xs text-slate-400">
          Meeting title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
          />
        </label>

        <label className="text-xs text-slate-400">
          Organizer / host
          <input
            value={organizer}
            onChange={(event) => setOrganizer(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
          />
        </label>

        <label className="text-xs text-slate-400">
          Meeting type
          <select
            value={meetingType}
            onChange={(event) =>
              setMeetingType(
                event.target.value as
                  | "scheduled"
                  | "instant"
                  | "personal"
                  | "team_room"
              )
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
          >
            <option value="scheduled">Scheduled meeting</option>
            <option value="instant">Meet now</option>
            <option value="team_room">Team room</option>
            <option value="personal">Personal meeting</option>
          </select>
        </label>

        <label className="text-xs text-slate-400">
          Access
          <select
            value={accessPolicy}
            onChange={(event) =>
              setAccessPolicy(
                event.target.value as
                  | "private"
                  | "team"
                  | "invited"
                  | "public"
              )
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
          >
            <option value="team">Team members</option>
            <option value="invited">Invited participants</option>
            <option value="private">Private</option>
            <option value="public">Public link</option>
          </select>
        </label>

        {meetingType !== "instant" ? (
          <>
            <label className="text-xs text-slate-400">
              Meeting date
              <input
                type="date"
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
              />
            </label>

            <label className="text-xs text-slate-400">
              Start time
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
              />
            </label>

            <label className="text-xs text-slate-400">
              End time
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs text-slate-400">Duration</div>
              <div className="mt-2 font-semibold text-slate-100">
                {durationMinutes} minutes
              </div>
            </div>
          </>
        ) : null}

        {rooms.length > 0 ? (
          <label className="text-xs text-slate-400">
            Meeting room
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
            >
              <option value="">Default room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="text-xs text-slate-400">
          Default language
          <select
            value={defaultLanguageCode}
            onChange={(event) =>
              setDefaultLanguageCode(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs text-slate-400">
        Agenda / purpose
        <textarea
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
        />
      </label>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            const enabled = !translationEnabled;
            setTranslationEnabled(enabled);
            setLanguageMode(enabled ? "multi" : "single");
          }}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm"
        >
          <div className="font-semibold text-slate-100">Translation</div>
          <div className="mt-1 text-xs text-cyan-200">
            {translationEnabled ? "Enabled" : "Disabled"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRecordingEnabled((value) => !value)}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm"
        >
          <div className="font-semibold text-slate-100">Recording</div>
          <div className="mt-1 text-xs text-cyan-200">
            {recordingEnabled ? "Enabled" : "Disabled"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLobbyEnabled((value) => !value)}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm"
        >
          <div className="font-semibold text-slate-100">Waiting room</div>
          <div className="mt-1 text-xs text-cyan-200">
            {lobbyEnabled ? "Enabled" : "Disabled"}
          </div>
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {createdMeeting ? (
        <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3">
          <div className="font-semibold text-emerald-100">
            Meeting created successfully
          </div>
          <div className="mt-1 text-sm text-emerald-200">
            Code: {createdMeeting.meeting_code}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || !effectiveTeamId || !title.trim()}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating meeting..." : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-white/10 px-5 py-3 text-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
