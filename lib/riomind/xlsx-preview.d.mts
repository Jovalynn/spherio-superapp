export class SpreadsheetValidationError extends Error {}
export function extractXlsxPreview(input: Uint8Array, options?: {timeoutMs?: number}): Promise<string>;
export function validateWorkbookArchive(input: Uint8Array): void;

export function extractDocxPreview(input: Uint8Array, options?: { timeoutMs?: number }): Promise<string>;
