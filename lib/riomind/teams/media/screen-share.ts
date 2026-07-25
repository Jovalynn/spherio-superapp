export async function requestScreenShare(): Promise<MediaStream> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices
      ?.getDisplayMedia
  ) {
    throw new Error(
      "Screen sharing is unavailable.",
    );
  }

  return navigator.mediaDevices
    .getDisplayMedia({
      video: true,
      audio: true,
    });
}
