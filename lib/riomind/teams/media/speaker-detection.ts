export type SpeakingSample = {
  volume: number;
  threshold: number;
};

export function isSpeaking(
  sample: SpeakingSample,
): boolean {
  return sample.volume >= sample.threshold;
}
