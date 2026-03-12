/**
 * URL encoding/decoding for the `fq` query parameter.
 * Production Refrens uses: JSON → encodeURIComponent → btoa → encodeURIComponent
 */

export function encodeFilters(filters: Record<string, any>): string {
  const jsonStr = JSON.stringify(filters);
  const urlEncoded = encodeURIComponent(jsonStr);
  const base64 = btoa(urlEncoded);
  return encodeURIComponent(base64);
}

export function decodeFilters(fq: string): Record<string, any> {
  try {
    const base64 = decodeURIComponent(fq);
    const urlEncoded = atob(base64);
    const jsonStr = decodeURIComponent(urlEncoded);
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}
