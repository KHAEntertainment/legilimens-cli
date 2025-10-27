/**
 * Terminal Manager - Full-screen TUI state management
 *
 * Manages terminal alternate screen buffer for a clean TUI experience:
 * - Clears terminal and enters alternate buffer on start
 * - Restores original terminal state and history on exit
 * - Similar to vim, less, or other full-screen terminal apps
 */

import { WriteStream } from 'tty';

/**
 * ANSI escape sequences for terminal control
 */
const ANSI = {
  // Alternate screen buffer
  ENTER_ALT_SCREEN: '\x1b[?1049h',  // Save cursor position and enter alternate screen
  EXIT_ALT_SCREEN: '\x1b[?1049l',   // Exit alternate screen and restore cursor position

  // Screen clearing
  CLEAR_SCREEN: '\x1b[2J',          // Clear entire screen
  CLEAR_SCROLLBACK: '\x1b[3J',      // Clear scrollback buffer
  CURSOR_HOME: '\x1b[H',            // Move cursor to top-left

  // Cursor control
  HIDE_CURSOR: '\x1b[?25l',         // Hide cursor
  SHOW_CURSOR: '\x1b[?25h',         // Show cursor

  // Mouse support (optional, for future enhancements)
  ENABLE_MOUSE: '\x1b[?1000h',      // Enable mouse tracking
  DISABLE_MOUSE: '\x1b[?1000l',     // Disable mouse tracking
};

export interface TerminalManagerOptions {
  /**
   * Enable alternate screen buffer (recommended for full-screen TUI)
   */
  useAltScreen?: boolean;

  /**
   * Hide cursor during TUI operation
   */
  hideCursor?: boolean;

  /**
   * Clear screen on start (even if not using alt screen)
   */
  clearOnStart?: boolean;

  /**
   * Enable mouse support (experimental)
   */
  enableMouse?: boolean;
}

export class TerminalManager {
  private isActive = false;
  private options: Required<TerminalManagerOptions>;
  private stdout: WriteStream;
  private cleanupHandlers: Array<() => void> = [];

  constructor(options: TerminalManagerOptions = {}) {
    this.options = {
      useAltScreen: options.useAltScreen ?? true,
      hideCursor: options.hideCursor ?? true,
      clearOnStart: options.clearOnStart ?? true,
      enableMouse: options.enableMouse ?? false,
    };

    this.stdout = process.stdout as WriteStream;

    // Register cleanup on process exit
    this.registerCleanup();
  }

  /**
   * Enter full-screen TUI mode
   */
  enter(): void {
    if (this.isActive) {
      return;
    }

    // Check if stdout is a TTY
    if (!this.stdout.isTTY) {
      // Non-TTY output (piped/redirected), skip terminal control
      return;
    }

    try {
      // Enter alternate screen buffer
      if (this.options.useAltScreen) {
        this.stdout.write(ANSI.ENTER_ALT_SCREEN);
      }

      // Clear screen
      if (this.options.clearOnStart) {
        this.stdout.write(ANSI.CLEAR_SCREEN + ANSI.CURSOR_HOME);
      }

      // Hide cursor
      if (this.options.hideCursor) {
        this.stdout.write(ANSI.HIDE_CURSOR);
      }

      // Enable mouse (optional)
      if (this.options.enableMouse) {
        this.stdout.write(ANSI.ENABLE_MOUSE);
      }

      this.isActive = true;
    } catch (error) {
      // Silently fail if terminal control is not supported
      if (process.env.LEGILIMENS_DEBUG) {
        console.error('Failed to enter TUI mode:', error);
      }
    }
  }

  /**
   * Exit full-screen TUI mode and restore terminal state
   */
  exit(): void {
    if (!this.isActive) {
      return;
    }

    if (!this.stdout.isTTY) {
      return;
    }

    try {
      // Disable mouse
      if (this.options.enableMouse) {
        this.stdout.write(ANSI.DISABLE_MOUSE);
      }

      // Show cursor
      if (this.options.hideCursor) {
        this.stdout.write(ANSI.SHOW_CURSOR);
      }

      // Exit alternate screen buffer (restores previous content)
      if (this.options.useAltScreen) {
        this.stdout.write(ANSI.EXIT_ALT_SCREEN);
      }

      this.isActive = false;
    } catch (error) {
      // Silently fail
      if (process.env.LEGILIMENS_DEBUG) {
        console.error('Failed to exit TUI mode:', error);
      }
    }
  }

  /**
   * Clear the screen (within current buffer)
   */
  clear(): void {
    if (this.stdout.isTTY) {
      this.stdout.write(ANSI.CLEAR_SCREEN + ANSI.CURSOR_HOME);
    }
  }

  /**
   * Register cleanup handlers for graceful exit
   */
  private registerCleanup(): void {
    const cleanup = () => {
      this.exit();
    };

    // Handle various exit scenarios
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      this.exit();
      process.exit(130); // Standard exit code for SIGINT
    });
    process.on('SIGTERM', () => {
      this.exit();
      process.exit(143); // Standard exit code for SIGTERM
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.exit();
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      this.exit();
      console.error('Unhandled rejection:', reason);
      process.exit(1);
    });

    this.cleanupHandlers.push(cleanup);
  }

  /**
   * Check if terminal is in TUI mode
   */
  isInTuiMode(): boolean {
    return this.isActive;
  }

  /**
   * Get terminal dimensions
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.stdout.columns || 80,
      height: this.stdout.rows || 24,
    };
  }
}

/**
 * Singleton instance for easy access
 */
let globalTerminalManager: TerminalManager | null = null;

export function getTerminalManager(options?: TerminalManagerOptions): TerminalManager {
  if (!globalTerminalManager) {
    globalTerminalManager = new TerminalManager(options);
  }
  return globalTerminalManager;
}

/**
 * Convenience function to wrap a TUI application
 */
export async function withTuiMode<T>(
  fn: () => Promise<T>,
  options?: TerminalManagerOptions
): Promise<T> {
  const manager = getTerminalManager(options);

  try {
    manager.enter();
    return await fn();
  } finally {
    manager.exit();
  }
}
