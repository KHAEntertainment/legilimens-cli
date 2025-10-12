/**
 * Parse percentage value from detail string
 * @param detail Optional detail string that may contain a percentage
 * @returns Parsed percentage (0-100) or null if not found
 */
export function parsePercent(detail?: string): number | null {
  if (!detail) return null;
  
  const match = detail.match(/\b(\d{1,3})%\b/);
  if (!match) return null;
  
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  
  return Math.max(0, Math.min(100, value));
}
