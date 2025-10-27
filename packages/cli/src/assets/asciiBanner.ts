import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import figlet from 'figlet';
import gradient from 'gradient-string';
import chalk from 'chalk';

export type BannerSource = 'external' | 'figlet' | 'fallback';

export interface BannerOptions {
  /**
   * Optional text to render when generating the banner with figlet.
   */
  text?: string;
  /**
   * Preferred figlet font. Falls back to `Standard` when unavailable.
   */
  font?: string;
  /**
   * Optional filesystem path to an art asset that should be rendered instead of figlet output.
   */
  externalPath?: string;
  /**
   * When true, skip expensive rendering and return a trimmed fallback suited for minimal mode.
   */
  minimal?: boolean;
  /**
   * Allows callers to hint at the terminal width so art can be validated against it.
   */
  width?: number;
}

export interface BannerResult {
  lines: string[];
  source: BannerSource;
  diagnostics?: string;
}

const DEFAULT_TEXT = 'Legilimens';
const DEFAULT_FONT = 'Standard';
const DEFAULT_MAX_WIDTH = 80;

const FALLBACK_BANNER: string[] = [
  ' _                 _ _ _                                     ',
  '| |   ___  ___ ___(_) (_)___  ___ ___ _ __  ___ _ __  ___ ___',
  '| |__/ _ \\/ __/ __| | | / __|/ __/ _ \\ \'__|/ _ \\ \'_ \\/ __/ __|',
  '|____\\___/\\__\\__ \\ | | \\__ \\ (_|  __/ |  |  __/ | | \\__ \\__ \\',
  '                   |_|_|___/\\___\\___|_|   \\___|_| |_|___/___/'
];

const toLines = (value: string): string[] => value.replaceAll('\r\n', '\n').split('\n');

const isPrintableLine = (line: string): boolean =>
  Array.from(line).every((char) => {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      return false;
    }
    // Allow common whitespace (space and tab) plus any visible glyphs.
    return codePoint >= 0x20 || char === '\t';
  });

const withinWidth = (lines: string[], maxWidth: number): boolean =>
  lines.every((line) => Array.from(line).length <= maxWidth);

interface BannerLoadOutcome {
  banner: BannerResult | null;
  error?: string;
}

const loadExternalBanner = (externalPath: string, maxWidth: number): BannerLoadOutcome => {
  const absolutePath = resolve(externalPath);
  if (!existsSync(absolutePath)) {
    return { banner: null, error: `External banner "${externalPath}" not found.` };
  }

  const contents = readFileSync(absolutePath, 'utf8').trimEnd();
  if (!contents) {
    return { banner: null, error: `External banner "${externalPath}" is empty.` };
  }

  const lines = toLines(contents);
  if (!lines.every(isPrintableLine)) {
    return {
      banner: null,
      error: `External banner "${externalPath}" contains unsupported control characters.`
    };
  }

  if (!withinWidth(lines, maxWidth)) {
    return {
      banner: null,
      error: `External banner "${externalPath}" exceeds ${maxWidth} columns.`
    };
  }

  return {
    banner: {
      lines,
      source: 'external'
    }
  };
};

const renderFigletBanner = (
  text: string,
  font: string,
  width?: number
): BannerLoadOutcome => {
  const availableFonts = figlet.fontsSync();
  if (!availableFonts.includes(font)) {
    return { banner: null, error: `Figlet font "${font}" is unavailable.` };
  }

  const rendered = figlet.textSync(text, {
    font,
    width,
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  if (!rendered) {
    return { banner: null, error: 'Figlet rendered an empty banner.' };
  }

  const lines = toLines(rendered);
  if (!lines.every(isPrintableLine)) {
    return { banner: null, error: 'Figlet output contained unsupported characters.' };
  }

  if (typeof width === 'number' && !withinWidth(lines, width)) {
    return {
      banner: null,
      error: `Figlet banner exceeded configured width of ${width} columns.`
    };
  }

  return {
    banner: {
      lines,
      source: 'figlet'
    }
  };
};

export const loadAsciiBanner = (options: BannerOptions = {}): BannerResult => {
  if (options.minimal) {
    return {
      lines: [DEFAULT_TEXT.toUpperCase()],
      source: 'fallback',
      diagnostics: 'Minimal mode requested; skipping ASCII art.'
    };
  }

  const maxWidth =
    options.width && Number.isFinite(options.width) ? Number(options.width) : DEFAULT_MAX_WIDTH;

  let diagnostics: string | undefined;

  if (options.externalPath) {
    const { banner, error } = loadExternalBanner(options.externalPath, maxWidth);
    if (banner) {
      return banner;
    }
    diagnostics = error;
  }

  const text = options.text ?? DEFAULT_TEXT;
  const font = options.font ?? DEFAULT_FONT;
  const { banner: figletBanner, error: figletError } = renderFigletBanner(text, font, maxWidth);

  if (figletBanner) {
    return diagnostics
      ? {
          ...figletBanner,
          diagnostics
        }
      : figletBanner;
  }

  return {
    lines: [...FALLBACK_BANNER],
    source: 'fallback',
    diagnostics:
      diagnostics ??
      figletError ??
      `Unable to render figlet font "${font}". Falling back to static banner.`
  };
};

export const bannerToString = (banner: BannerResult, applyColors: boolean = true): string => {
  const text = banner.lines.join('\n');
  
  // Apply gradient if colors are enabled
  if (applyColors && !process.env.NO_COLOR) {
    // Legilimens brand gradient: purple → cyan → teal
    const brandGradient = gradient(['#7F5AF0', '#2CB1BC', '#22D3EE']);
    return brandGradient(text);
  }
  
  return text;
};
