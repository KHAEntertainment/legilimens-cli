import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import figlet from 'figlet';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..', '..', '..');
const OUTPUT_DIR = resolve(__dirname, '../dist/assets');
const EXTERNAL_BANNER_PATH = resolve(ROOT_DIR, 'docs/ascii-art.md');
const MAX_WIDTH = 80;
const DEFAULT_TEXT = 'Legilimens';
const DEFAULT_FONT = 'Standard';
const FALLBACK_BANNER = [
  ' _                 _ _ _                                     ',
  '| |   ___  ___ ___(_) (_)___  ___ ___ _ __  ___ _ __  ___ ___',
  '| |__/ _ \\/ __/ __| | | / __|/ __/ _ \\ \'__|/ _ \\ \'_ \\/ __/ __|',
  '|____\\___/\\__\\__ \\ | | \\__ \\ (_|  __/ |  |  __/ | | \\__ \\__ \\',
  '                   |_|_|___/\\___\\___|_|   \\___|_| |_|___/___/'
];

const toLines = (value) => value.replaceAll('\r\n', '\n').split('\n');

const isPrintableLine = (line) =>
  Array.from(line).every((char) => {
    const codePoint = char.codePointAt(0);
    return codePoint !== undefined && (codePoint >= 0x20 || char === '\t');
  });

const ensureWidth = (lines, label) => {
  const tooWide = lines.find((line) => Array.from(line).length > MAX_WIDTH);
  if (tooWide) {
    throw new Error(
      `[${label}] banner line exceeds ${MAX_WIDTH} columns (${Array.from(tooWide).length}): "${tooWide}"`
    );
  }
};

const writeBanner = async (filename, content) => {
  await writeFile(resolve(OUTPUT_DIR, filename), `${content}\n`, 'utf8');
};

const loadExternalBanner = async () => {
  const contents = await readFile(EXTERNAL_BANNER_PATH, 'utf8');
  const trimmed = contents.trimEnd();
  if (!trimmed) {
    throw new Error('external banner file is empty');
  }
  const lines = toLines(trimmed);
  if (!lines.every(isPrintableLine)) {
    throw new Error('external banner contains unsupported control characters');
  }
  ensureWidth(lines, 'external');
  return { lines, source: 'external' };
};

const renderFiglet = () => {
  const availableFonts = figlet.fontsSync();
  if (!availableFonts.includes(DEFAULT_FONT)) {
    throw new Error(`figlet font "${DEFAULT_FONT}" unavailable`);
  }

  const rendered = figlet.textSync(DEFAULT_TEXT, {
    font: DEFAULT_FONT,
    width: MAX_WIDTH,
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  if (!rendered) {
    throw new Error('figlet returned empty output');
  }

  const lines = toLines(rendered);
  if (!lines.every(isPrintableLine)) {
    throw new Error('figlet output contains unsupported characters');
  }
  ensureWidth(lines, 'figlet');
  return { lines, source: 'figlet' };
};

const main = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  let banner;
  try {
    banner = await loadExternalBanner();
  } catch (error) {
    process.stderr.write(
      `[build-assets] external banner unavailable (${error?.message ?? error}); falling back to figlet\n`
    );
    try {
      banner = renderFiglet();
    } catch (figletError) {
      process.stderr.write(
        `[build-assets] figlet rendering failed (${figletError?.message ?? figletError}); using fallback banner\n`
      );
      banner = { lines: [...FALLBACK_BANNER], source: 'fallback' };
      ensureWidth(banner.lines, 'fallback');
    }
  }

  const minimalLines = [DEFAULT_TEXT.toUpperCase()];
  ensureWidth(minimalLines, 'minimal');

  await writeBanner('banner.txt', banner.lines.join('\n'));
  await writeBanner('banner-minimal.txt', minimalLines.join('\n'));

  process.stdout.write(
    [
      `[build-assets] banner source: ${banner.source}`,
      `lines: ${banner.lines.length}`,
      `minimal mode lines: ${minimalLines.length}`
    ].join(' | ') + '\n'
  );
};

main().catch((error) => {
  console.error('[build-assets] Failed to prepare ASCII assets:', error);
  process.exitCode = 1;
});
