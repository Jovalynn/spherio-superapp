import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type MeetingConnectionQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "offline"
  | string;

export type MeetingPresenceState = {
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  screenSharing?: boolean;
  speaking?: boolean;
  handRaised?: boolean;
  presenceStatus?:
    | "waiting"
    | "joining"
    | "in_meeting"
    | "away"
    | "reconnecting"
    | "left"
    | "removed"
    | "offline";
  connectionStatus?: string;
  connectionQuality?: MeetingConnectionQuality | null;
  runtimeMetadata?: Record<string, unknown>;
};

type UseMeetingPresenceOptions = {
  meetingCode: string;
  runtimeId: string | null | undefined;
  state?: MeetingPresenceState;
  intervalMs?: number;
  enabled?: boolean;
  sendLeaveOnUnmount?: boolean;
};

type HeartbeatStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "paused"
  | "offline"
  | "error";

type HeartbeatResponse = {
  ok?: boolean;
  action?: string;
  participant?: Record<string, unknown>;
  error?: string;
};

const DEFAULT_HEARTBEAT_INTERVAL_MS = 5_000;

export function useMeetingPresence({
  meetingCode,
  runtimeId,
  state = {},
  intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
  enabled = true,
  sendLeaveOnUnmount = false,
}: UseMeetingPresenceOptions) {
  const [status, setStatus] =
    useState<HeartbeatStatus>("idle");
  const [lastHeartbeatAt, setLastHeartbeatAt] =
    useState<Date | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const stateRef = useRef(state);
  const requestInFlightRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const endpoint =
    meetingCode && runtimeId
      ? `/api/riomind/meetings/${encodeURIComponent(
          meetingCode
        )}/participants/runtime`
      : null;

  const sendHeartbeat = useCallback(
    async (
      overrides: Partial<MeetingPresenceState> = {}
    ) => {
      if (
        !enabled ||
        !endpoint ||
        !runtimeId ||
        requestInFlightRef.current
      ) {
        return null;
      }

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        setStatus("offline");
        return null;
      }

      requestInFlightRef.current = true;

      setStatus((current) =>
        current === "connected"
          ? "connected"
          : "connecting"
      );

      try {
        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            runtimeId,
            action: "heartbeat",
            presenceStatus: "in_meeting",
            connectionStatus: "connected",
            ...stateRef.current,
            ...overrides,
          }),
        });

        const payload =
          (await response
            .json()
            .catch(() => ({}))) as HeartbeatResponse;

        if (!response.ok || payload.ok === false) {
          throw new Error(
            payload.error ||
              `Heartbeat failed with HTTP ${response.status}.`
          );
        }

        if (mountedRef.current) {
          setStatus("connected");
          setLastHeartbeatAt(new Date());
          setError(null);
        }

        return payload.participant || null;
      } catch (heartbeatError) {
        const message =
          heartbeatError instanceof Error
            ? heartbeatError.message
            : "Meeting heartbeat failed.";

        if (mountedRef.current) {
          setStatus("reconnecting");
          setError(message);
        }

        return null;
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [
      enabled,
      endpoint,
      runtimeId,
    ]
  );

  const sendLeave = useCallback(async () => {
    if (!endpoint || !runtimeId) {
      return;
    }

    const body = JSON.stringify({
      runtimeId,
      action: "leave",
    });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], {
        type: "application/json",
      });

      navigator.sendBeacon(endpoint, blob);
      return;
    }

    try {
      await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        keepalive: true,
        body,
      });
    } catch {
      // Leaving the page must never block navigation.
    }
  }, [endpoint, runtimeId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !endpoint || !runtimeId) {
      setStatus("idle");

      return () => {
        mountedRef.current = false;
      };
    }

    let intervalId:
      | ReturnType<typeof setInterval>
      | null = null;

    const clearHeartbeatInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startHeartbeatInterval = () => {
      clearHeartbeatInterval();

      intervalId = setInterval(() => {
        if (
          document.visibilityState === "visible"
        ) {
          void sendHeartbeat();
        }
      }, Math.max(intervalMs, 2_000));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setStatus("paused");
        clearHeartbeatInterval();
        return;
      }

      void sendHeartbeat();
      startHeartbeatInterval();
    };

    const handleOnline = () => {
      setStatus("reconnecting");
      void sendHeartbeat();
      startHeartbeatInterval();
    };

    const handleOffline = () => {
      setStatus("offline");
      clearHeartbeatInterval();
    };

    void sendHeartbeat();
    startHeartbeatInterval();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mountedRef.current = false;
      clearHeartbeatInterval();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener(
        "online",
        handleOnline
      );
      window.removeEventListener(
        "offline",
        handleOffline
      );

      if (sendLeaveOnUnmount) {
        void sendLeave();
      }
    };
  }, [
    enabled,
    endpoint,
    intervalMs,
    runtimeId,
    sendHeartbeat,
    sendLeave,
    sendLeaveOnUnmount,
  ]);

  return {
    status,
    error,
    lastHeartbeatAt,
    sendHeartbeat,
    sendLeave,
    isConnected: status === "connected",
    isReconnecting:
      status === "reconnecting" ||
      status === "connecting",
  };
}
