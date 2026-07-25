export async function requestMicrophoneStream(
  constraints:
    MediaTrackConstraints = {},
): Promise<MediaStream> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error(
      "Microphone access is unavailable.",
    );
  }

  return navigator.mediaDevices.getUserMedia({
    video: false,
    audio: constraints,
  });
}
