export async function requestCameraStream(
  constraints:
    MediaTrackConstraints = {},
): Promise<MediaStream> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error(
      "Camera access is unavailable.",
    );
  }

  return navigator.mediaDevices.getUserMedia({
    video: constraints,
    audio: false,
  });
}
