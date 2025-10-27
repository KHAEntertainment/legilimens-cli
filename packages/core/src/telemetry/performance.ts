import { performance } from 'node:perf_hooks';
import type { PerformanceMetrics } from '../types.js';

export const INTERACTIVE_TARGET_MS = 10_000;
export const ABSOLUTE_MAX_MS = 60_000;

export interface PerformanceTrackerOptions {
  minimalModeRequested: boolean;
}

export interface PerformanceTracker {
  finish(): PerformanceMetrics;
}

export const createPerformanceTracker = (
  options: PerformanceTrackerOptions
): PerformanceTracker => {
  const start = performance.now();

  return {
    finish(): PerformanceMetrics {
      const durationMs = Math.round(performance.now() - start);
      const exceededInteractiveTarget = durationMs > INTERACTIVE_TARGET_MS;
      const exceededAbsoluteCeiling = durationMs > ABSOLUTE_MAX_MS;

      if (exceededAbsoluteCeiling) {
        throw new Error(
          `Generation exceeded ${ABSOLUTE_MAX_MS / 1000}s guardrail (ran for ${durationMs}ms).`
        );
      }

      const minimalModeRecommended =
        options.minimalModeRequested || exceededInteractiveTarget;

      return {
        durationMs,
        exceededInteractiveTarget,
        exceededAbsoluteCeiling,
        minimalModeRequested: options.minimalModeRequested,
        minimalModeRecommended
      };
    }
  };
};

export const summarizePerformance = (metrics: PerformanceMetrics): string => {
  const base = metrics.exceededInteractiveTarget
    ? `Exceeded interactive comfort target (10s) with ${metrics.durationMs}ms runtime.`
    : `Completed within interactive target in ${metrics.durationMs}ms.`;

  const minimalModeHint = metrics.minimalModeRecommended
    ? 'Enable minimal mode in constrained terminals or follow-up runs.'
    : 'Minimal mode optional for future runs.';

  return `${base} ${minimalModeHint}`;
};
