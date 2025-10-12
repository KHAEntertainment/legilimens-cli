import chalk, { supportsColor } from 'chalk';
import gradient from 'gradient-string';
import { stdout as defaultStdout } from 'node:process';

export interface BrandThemeTokens {
  name: 'modern';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    emphasis: string;
    background: string;
  };
  gradientStops: [string, string, ...string[]];
  bullets: {
    primary: string;
    secondary: string;
  };
  tagline: string;
}

export const brandTheme: BrandThemeTokens = {
  name: 'modern',
  colors: {
    primary: '#7F5AF0',
    secondary: '#2CB1BC',
    accent: '#F6C177',
    neutral: '#94A3B8',
    emphasis: '#E2E8F0',
    background: '#0F172A'
  },
  gradientStops: ['#7F5AF0', '#2CB1BC', '#22D3EE'],
  bullets: {
    primary: '>',
    secondary: '-'
  },
  tagline: 'DeepWiki for coding, static files for planning.'
} as const;

export interface ThemeRenderOptions {
  stream?: NodeJS.WriteStream;
  forcePlain?: boolean;
}

const hasStreamColorSupport = (stream?: NodeJS.WriteStream): boolean => {
  if (!stream) {
    return false;
  }

  const maybeHasColors = (stream as NodeJS.WriteStream & {
    hasColors?: () => boolean | { hasBasic: boolean; has256: boolean; has16m: boolean };
  }).hasColors;

  if (typeof maybeHasColors === 'function') {
    try {
      const value = maybeHasColors.call(stream);
      if (typeof value === 'boolean') {
        return value;
      }
      if (value && typeof value === 'object') {
        return Boolean(value.hasBasic || value.has256 || value.has16m);
      }
    } catch {
      return Boolean(stream.isTTY);
    }
  }

  return Boolean(stream.isTTY);
};

const hasGlobalColorSupport = (): boolean =>
  Boolean(supportsColor && (supportsColor.has16m || supportsColor.has256 || supportsColor.hasBasic));

export const supportsBrandColor = (options: ThemeRenderOptions = {}): boolean => {
  if (options.forcePlain) {
    return false;
  }

  const stream = options.stream ?? defaultStdout;
  return hasStreamColorSupport(stream) || hasGlobalColorSupport();
};

export const applyBrandGradient = (text: string, options: ThemeRenderOptions = {}): string => {
  if (!supportsBrandColor(options)) {
    return text;
  }

  return gradient(brandTheme.gradientStops)(text);
};

export const accentText = (text: string, options: ThemeRenderOptions = {}): string => {
  if (!supportsBrandColor(options)) {
    return text;
  }

  return chalk.hex(brandTheme.colors.accent)(text);
};

export const primaryText = (text: string, options: ThemeRenderOptions = {}): string => {
  if (!supportsBrandColor(options)) {
    return text;
  }

  return chalk.hex(brandTheme.colors.primary)(text);
};

export const neutralText = (text: string, options: ThemeRenderOptions = {}): string => {
  if (!supportsBrandColor(options)) {
    return text;
  }

  return chalk.hex(brandTheme.colors.neutral)(text);
};

export const formatModeLabel = (mode: 'default' | 'minimal' | 'low-contrast'): string => {
  switch (mode) {
    case 'minimal':
      return 'Minimal mode';
    case 'low-contrast':
      return 'Low-contrast mode';
    default:
      return 'Modern mode';
  }
};
