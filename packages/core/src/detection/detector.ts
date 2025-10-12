/**
 * Simple dependency type detector for fetcher orchestration
 */

export type DependencyTypeDetection = 'github' | 'npm' | 'url' | 'unknown';

/**
 * Detect dependency type from identifier string
 */
export function detectDependencyType(identifier: string): DependencyTypeDetection {
  // GitHub patterns
  if (identifier.includes('github.com') || identifier.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/)) {
    return 'github';
  }

  // URL pattern
  if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
    return 'url';
  }

  // NPM package pattern (scoped or unscoped)
  if (identifier.match(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/)) {
    return 'npm';
  }

  return 'unknown';
}
