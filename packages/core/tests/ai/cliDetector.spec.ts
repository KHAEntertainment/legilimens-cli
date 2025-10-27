import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import {
  detectInstalledCliTools,
  isCliToolAvailable,
  resolveCliToolPath,
  type CliToolName
} from '../../src/ai/cliDetector.js';

vi.mock('child_process');
vi.mock('fs');

describe('cliDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectInstalledCliTools', () => {
    it('should detect available tools correctly', () => {
      const mockExecSync = vi.mocked(execSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      mockExecSync.mockImplementation((command: string, options: any) => {
        if (command.includes('which gemini')) {
          return '/usr/local/bin/gemini\n';
        }
        if (command.includes('which codex')) {
          return '/usr/local/bin/codex\n';
        }
        throw new Error('Command not found');
      });
      
      mockExistsSync.mockImplementation((path: string) => {
        return path === '/usr/local/bin/gemini' || path === '/usr/local/bin/codex';
      });

      const result = detectInstalledCliTools();

      expect(result.tools).toHaveLength(4);
      expect(result.availableTools).toHaveLength(2);
      expect(result.availableTools.map((t) => t.name)).toContain('gemini');
      expect(result.availableTools.map((t) => t.name)).toContain('codex');
    });

    it('should handle unavailable tools gracefully', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = detectInstalledCliTools();

      expect(result.tools).toHaveLength(4);
      expect(result.availableTools).toHaveLength(0);
      result.tools.forEach((tool) => {
        expect(tool.available).toBe(false);
        expect(tool.path).toBeNull();
      });
    });

    it('should include correct metadata for available tools', () => {
      const mockExecSync = vi.mocked(execSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      mockExecSync.mockImplementation((command: string, options: any) => {
        if (command.includes('which claude')) {
          return '/usr/local/bin/claude\n';
        }
        throw new Error('Command not found');
      });
      
      mockExistsSync.mockImplementation((path: string) => {
        return path === '/usr/local/bin/claude';
      });

      const result = detectInstalledCliTools();

      const claudeTool = result.availableTools.find((t) => t.name === 'claude');
      expect(claudeTool).toBeDefined();
      expect(claudeTool?.available).toBe(true);
      expect(claudeTool?.path).toBe('/usr/local/bin/claude');
      expect(claudeTool?.command).toBe('claude');
    });
  });

  describe('isCliToolAvailable', () => {
    it('should return true for available tools', () => {
      const mockExecSync = vi.mocked(execSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      mockExecSync.mockImplementation((command: string, options: any) => {
        if (command.includes('which qwen')) {
          return '/usr/local/bin/qwen\n';
        }
        throw new Error('Command not found');
      });
      mockExistsSync.mockImplementation((path: string) => {
        return path === '/usr/local/bin/qwen';
      });

      const result = isCliToolAvailable('qwen');

      expect(result).toBe(true);
    });

    it('should return false for unavailable tools', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = isCliToolAvailable('gemini');

      expect(result).toBe(false);
    });

    it('should handle invalid tool names gracefully', () => {
      const result = isCliToolAvailable('invalid-tool' as CliToolName);

      expect(result).toBe(false);
    });
  });

  describe('resolveCliToolPath', () => {
    it('should return correct path for available tools', () => {
      const mockExecSync = vi.mocked(execSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      mockExecSync.mockImplementation((command: string, options: any) => {
        if (command.includes('which gemini')) {
          return '/opt/homebrew/bin/gemini\n';
        }
        throw new Error('Command not found');
      });
      mockExistsSync.mockImplementation((path: string) => {
        return path === '/opt/homebrew/bin/gemini';
      });

      const path = resolveCliToolPath('gemini');

      expect(path).toBe('/opt/homebrew/bin/gemini');
    });

    it('should return null for unavailable tools', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const path = resolveCliToolPath('codex');

      expect(path).toBeNull();
    });

    it('should handle edge cases', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockReturnValue(Buffer.from(''));

      const path = resolveCliToolPath('claude');

      expect(path).toBeNull();
    });

    it('should handle multiple paths from Windows "where" command', () => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
      const mockExecSync = vi.mocked(execSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      mockExecSync.mockImplementation((command: string, options: any) => {
        if (command.includes('where gemini')) {
          return 'C:\\Program Files\\gemini\\gemini.exe\nC:\\Users\\user\\bin\\gemini.exe\n';
        }
        throw new Error('Command not found');
      });
      mockExistsSync.mockImplementation((path: string) => {
        return path === 'C:\\Program Files\\gemini\\gemini.exe' || 
               path === 'C:\\Users\\user\\bin\\gemini.exe';
      });

      const path = resolveCliToolPath('gemini');

      expect(path).toBe('C:\\Program Files\\gemini\\gemini.exe');
    });
  });
});
