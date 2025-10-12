import chalk from 'chalk';
import gradient from 'gradient-string';
import type { ThemeRenderOptions } from './brandTheme.js';
import type { CliMode } from '../config/env.js';

export type ThemeId = 'modern' | 'minimal' | 'low-contrast';

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  emphasis: string;
  background: string;
}

export interface ThemeProfile {
  id: ThemeId;
  label: string;
  /**
   * Controls whether large ASCII art should render.
   */
  asciiArt: 'full' | 'compact' | 'none';
  /**
   * Optional gradient stops for banner text when color rendering is enabled.
   */
  gradientStops?: [string, string, ...string[]];
  /**
   * Primary palette used when color rendering is allowed.
   */
  palette: ThemePalette;
  /**
   * When true, text rendering defaults to plain output even if ANSI colors are supported.
   */
  preferPlain: boolean;
  /**
   * Maximum content width to target for layouts. Components should clamp to this value.
   */
  maxContentWidth: number;
  /**
   * Context string surfaced in help output.
   */
  description: string;
}

export interface ThemeFormatters {
  accent: (text: string) => string;
  primary: (text: string) => string;
  neutral: (text: string) => string;
  emphasis: (text: string) => string;
  gradient: (text: string) => string;
  error: (text: string) => string;
  warning: (text: string) => string;
  info: (text: string) => string;
}

export interface ResolvedThemeProfile {
  id: ThemeId;
  label: string;
  asciiArtEnabled: boolean;
  asciiMode: ThemeProfile['asciiArt'];
  renderOptions: ThemeRenderOptions;
  palette: ThemePalette;
  description: string;
  maxContentWidth: number;
  formatters: ThemeFormatters;
}

const themeProfiles: Record<ThemeId, ThemeProfile> = {
  modern: {
    id: 'modern',
    label: 'Modern mode',
    asciiArt: 'full',
    gradientStops: ['#7F5AF0', '#2CB1BC', '#22D3EE'],
    palette: {
      primary: '#7F5AF0',
      secondary: '#2CB1BC',
      accent: '#F6C177',
      neutral: '#94A3B8',
      emphasis: '#E2E8F0',
      background: '#0F172A'
    },
    preferPlain: false,
    maxContentWidth: 80,
    description: 'Default rich experience with gradients, ASCII art, and vivid Legilimens branding.'
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal mode',
    asciiArt: 'none',
    palette: {
      primary: '#CBD5F5',
      secondary: '#CBD5F5',
      accent: '#E2E8F0',
      neutral: '#94A3B8',
      emphasis: '#E2E8F0',
      background: '#0B1120'
    },
    preferPlain: true,
    maxContentWidth: 80,
    description: 'Plain-text friendly output for CI logs and narrow terminals. Gradients disabled.'
  },
  'low-contrast': {
    id: 'low-contrast',
    label: 'Low-contrast mode',
    asciiArt: 'compact',
    palette: {
      primary: '#A5B4FC',
      secondary: '#C4B5FD',
      accent: '#FBCFE8',
      neutral: '#94A3B8',
      emphasis: '#F8FAFC',
      background: '#1E1E28'
    },
    preferPlain: false,
    maxContentWidth: 80,
    description:
      'Softened palette that reduces visual intensity while keeping semantic color cues intact.'
  }
};

const toThemeId = (mode: CliMode): ThemeId => {
  if (mode === 'minimal') {
    return 'minimal';
  }
  if (mode === 'low-contrast') {
    return 'low-contrast';
  }
  return 'modern';
};

const identity = (value: string): string => value;

export interface ResolveThemeOptions {
  mode: CliMode;
  ansiEnabled: boolean;
}

export const resolveThemeProfile = ({ mode, ansiEnabled }: ResolveThemeOptions): ResolvedThemeProfile => {
  const themeId = toThemeId(mode);
  const profile = themeProfiles[themeId];
  const useColors = ansiEnabled && !profile.preferPlain;
  const renderOptions: ThemeRenderOptions = {
    forcePlain: !useColors
  };

  const colorize = (hex: string): ((text: string) => string) => {
    if (!useColors) {
      return identity;
    }
    return (text: string): string => chalk.hex(hex)(text);
  };

  const applyGradient = profile.gradientStops && useColors
    ? (text: string): string => gradient(profile.gradientStops!)(text)
    : identity;

  const asciiArtEnabled = profile.asciiArt !== 'none' && useColors;

  return {
    id: profile.id,
    label: profile.label,
    asciiArtEnabled,
    asciiMode: profile.asciiArt,
    renderOptions,
    palette: profile.palette,
    description: profile.description,
    maxContentWidth: profile.maxContentWidth,
    formatters: {
      accent: colorize(profile.palette.accent),
      primary: colorize(profile.palette.primary),
      neutral: colorize(profile.palette.neutral),
      emphasis: colorize(profile.palette.emphasis),
      gradient: applyGradient,
      error: colorize('#EF4444'),
      warning: colorize('#F59E0B'),
      info: colorize('#3B82F6')
    }
  };
};

export const availableThemeProfiles = (): ThemeProfile[] => Object.values(themeProfiles);
