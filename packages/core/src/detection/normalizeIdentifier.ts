import { detectSourceType, type SourceType } from './sourceDetector.js';

export interface NormalizedIdentifier {
  raw: string;
  normalized: string;
  sourceType: SourceType;
  displayName: string;
}

const toDisplayName = (value: string): string =>
  value
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ') || 'Unknown Dependency';

export const normalizeIdentifier = (input: string): NormalizedIdentifier => {
  const raw = typeof input === 'string' ? input : '';
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      raw,
      normalized: 'unknown-dependency',
      sourceType: 'unknown',
      displayName: 'Unknown Dependency'
    };
  }

  const detection = detectSourceType(trimmed);
  const normalized = detection.normalizedIdentifier?.trim() || trimmed;

  return {
    raw,
    normalized,
    sourceType: detection.sourceType,
    displayName: toDisplayName(normalized)
  };
};
