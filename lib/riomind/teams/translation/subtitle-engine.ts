import type {
  CaptionLine,
} from "./captions";

export function appendCaptionLine(
  lines: CaptionLine[],
  line: CaptionLine,
  maximumLines = 100,
): CaptionLine[] {
  return [...lines, line].slice(
    -maximumLines,
  );
}
