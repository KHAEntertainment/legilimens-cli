import { writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

class DebugLogger {
  private debugLogPath: string;
  private enabled: boolean;

  constructor() {
    const logDir = join(homedir(), '.legilimens');
    this.debugLogPath = join(logDir, 'debug.log');
    this.enabled = process.env.LEGILIMENS_DEBUG === 'true';

    if (this.enabled) {
      try {
        mkdirSync(logDir, { recursive: true });
        // Clear old log on startup
        const timestamp = new Date().toISOString();
        writeFileSync(this.debugLogPath, `\n=== Debug Session Started: ${timestamp} ===\n`);
      } catch {
        // Ignore setup errors
      }
    }
  }

  log(category: string, message: string, data?: any) {
    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      let logEntry = `[${timestamp}] [${category}] ${message}`;

      if (data !== undefined) {
        if (typeof data === 'object') {
          logEntry += `\n${JSON.stringify(data, null, 2)}`;
        } else {
          logEntry += ` ${String(data)}`;
        }
      }

      logEntry += '\n';
      appendFileSync(this.debugLogPath, logEntry);
    } catch {
      // Ignore logging errors
    }
  }

  error(category: string, error: Error | string, context?: any) {
    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      let logEntry = `[${timestamp}] [ERROR:${category}] `;

      if (error instanceof Error) {
        logEntry += `${error.message}\n${error.stack}`;
      } else {
        logEntry += String(error);
      }

      if (context !== undefined) {
        logEntry += `\nContext: ${JSON.stringify(context, null, 2)}`;
      }

      logEntry += '\n';
      appendFileSync(this.debugLogPath, logEntry);
    } catch {
      // Ignore logging errors
    }
  }

  getLogPath(): string {
    return this.debugLogPath;
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();
