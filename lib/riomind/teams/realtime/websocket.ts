export type TeamsSocketOptions = {
  url: string;
  protocols?: string | string[];
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
};

export function connectTeamsSocket(
  options: TeamsSocketOptions,
): WebSocket {
  if (typeof WebSocket === "undefined") {
    throw new Error(
      "WebSocket is unavailable.",
    );
  }

  const socket = new WebSocket(
    options.url,
    options.protocols,
  );

  if (options.onOpen) {
    socket.addEventListener(
      "open",
      options.onOpen,
    );
  }

  if (options.onMessage) {
    socket.addEventListener(
      "message",
      options.onMessage,
    );
  }

  if (options.onClose) {
    socket.addEventListener(
      "close",
      options.onClose,
    );
  }

  if (options.onError) {
    socket.addEventListener(
      "error",
      options.onError,
    );
  }

  return socket;
}
