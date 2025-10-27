import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { generateWithCliTool } from '../../src/ai/cliOrchestrator.js';
import * as cliDetector from '../../src/ai/cliDetector.js';

vi.mock('child_process');
vi.mock('../../src/ai/cliDetector.js');

describe('cliOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockChildProcess = (exitCode: number, stdout: string, stderr = '') => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdin = {
      write: vi.fn(),
      end: vi.fn()
    };
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.kill = vi.fn();

    setTimeout(() => {
      if (stdout) {
        mockProcess.stdout.emit('data', Buffer.from(stdout));
      }
      if (stderr) {
        mockProcess.stderr.emit('data', Buffer.from(stderr));
      }
      mockProcess.emit('close', exitCode);
    }, 10);

    return mockProcess;
  };

  describe('generateWithCliTool', () => {
    it('should successfully generate content with preferred tool', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });
      mockSpawn.mockReturnValue(createMockChildProcess(0, aiResponse));

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 100,
        maxRetries: 0
      });

      expect(result.success).toBe(true);
      expect(result.content).toBe(aiResponse);
      expect(result.toolUsed).toBe('gemini');
      expect(result.attempts).toContain('gemini');
    });

    it('should fallback to next available tool when preferred fails', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true },
          { name: 'codex', command: 'codex', path: '/usr/local/bin/codex', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true },
          { name: 'codex', command: 'codex', path: '/usr/local/bin/codex', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let callCount = 0;
      mockSpawn.mockImplementation((command, args) => {
        callCount++;
        if (callCount === 1 && command.includes('gemini')) {
          // First call (gemini) fails
          return createMockChildProcess(1, '', 'Error');
        }
        // Second call (codex) succeeds
        return createMockChildProcess(0, aiResponse);
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 5000,
        maxRetries: 0
      });

      expect(result.success).toBe(true);
      expect(result.toolUsed).toBe('codex');
      expect(result.attempts).toEqual(['gemini', 'codex']);
    });

    it('should handle timeout correctly', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdin = { write: vi.fn(), end: vi.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = vi.fn();
      mockProcess.killed = false;

      // Never emit close event to simulate timeout
      mockSpawn.mockReturnValue(mockProcess);

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 5000,
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    }, 10000);

    it('should send SIGKILL if process ignores SIGTERM', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdin = { write: vi.fn(), end: vi.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = vi.fn();
      mockProcess.killed = false;

      // Mock process that ignores SIGTERM (doesn't set killed = true)
      mockProcess.kill.mockImplementation((signal: string) => {
        if (signal === 'SIGTERM') {
          // Process ignores SIGTERM, don't set killed = true
          return;
        }
        if (signal === 'SIGKILL') {
          mockProcess.killed = true;
        }
      });

      // Never emit close event to simulate timeout
      mockSpawn.mockReturnValue(mockProcess);

      // Use vi.useFakeTimers to control the 2-second delay
      vi.useFakeTimers();
      
      const promise = generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 100
      });

      // Advance time to trigger timeout
      await vi.advanceTimersByTimeAsync(100);
      
      // Advance time by 2 seconds to trigger SIGKILL
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;
      
      vi.useRealTimers();

      expect(result.success).toBe(false);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      expect(mockProcess.killed).toBe(true);
    });

    it('should return error when no tools are available', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [],
        availableTools: []
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No AI CLI tools detected');
      expect(result.attempts).toHaveLength(0);
    });

    it('should clean ANSI codes from output', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const outputWithAnsi = '\u001b[32mGreen text\u001b[0m\nNormal text';
      mockSpawn.mockReturnValue(createMockChildProcess(0, outputWithAnsi));

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini'
      });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Green text\nNormal text');
      expect(result.content).not.toContain('\u001b');
    });

    it('should use temp file mode first for gemini', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });
      
      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      await generateWithCliTool('test prompt', {
        preferredTool: 'gemini'
      });

      // Should try temp file first (args include temp file path)
      expect(spawnArgs[0]).toBe('/usr/local/bin/gemini');
      expect(spawnArgs[1][0]).toBe('-p');
      expect(spawnArgs[1][1]).toMatch(/legilimens-prompt-.*\.txt$/);
    });

    it('should use temp file mode first for codex with Responses API', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'codex', command: 'codex', path: '/usr/local/bin/codex', available: true }
        ],
        availableTools: [
          { name: 'codex', command: 'codex', path: '/usr/local/bin/codex', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      await generateWithCliTool('test prompt', {
        preferredTool: 'codex'
      });

      // Should try Responses API first (modern approach)
      expect(spawnArgs[0]).toBe('/usr/local/bin/codex');
      expect(spawnArgs[1]).toEqual(['api', 'responses.create', '-m', 'gpt-4o-mini', '-i', '-']);
    });

    it('should use temp file mode first for claude with correct -p flag', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'claude', command: 'claude', path: '/usr/local/bin/claude', available: true }
        ],
        availableTools: [
          { name: 'claude', command: 'claude', path: '/usr/local/bin/claude', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      await generateWithCliTool('test prompt', {
        preferredTool: 'claude'
      });

      // Should use -p flag (not --headless --prompt)
      expect(spawnArgs[0]).toBe('/usr/local/bin/claude');
      expect(spawnArgs[1][0]).toBe('-p');
      expect(spawnArgs[1][1]).toMatch(/legilimens-prompt-.*\.txt$/);
    });

    it('should use temp file mode first for qwen', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'qwen', command: 'qwen', path: '/usr/local/bin/qwen', available: true }
        ],
        availableTools: [
          { name: 'qwen', command: 'qwen', path: '/usr/local/bin/qwen', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      await generateWithCliTool('test prompt', {
        preferredTool: 'qwen'
      });

      // Should try temp file first (args include temp file path)
      expect(spawnArgs[0]).toBe('/usr/local/bin/qwen');
      expect(spawnArgs[1][0]).toBe('-p');
      expect(spawnArgs[1][1]).toMatch(/legilimens-prompt-.*\.txt$/);
    });

    it('should use command override even when tool not detected on PATH', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      // No tools detected, but override is provided
      mockDetect.mockReturnValue({
        tools: [],
        availableTools: []
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        commandOverride: '/custom/path/to/gemini',
        timeoutMs: 5000
      });

      // Should attempt the override path
      expect(result.success).toBe(true);
      expect(result.toolUsed).toBe('gemini');
      expect(spawnArgs[0]).toBe('/custom/path/to/gemini');
    });

    it('should use command override path for preferred tool when override is set', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      // Tool detected, but override is provided
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        commandOverride: '/custom/path/to/gemini',
        timeoutMs: 5000
      });

      // Should use the override path, not the detected path
      expect(result.success).toBe(true);
      expect(result.toolUsed).toBe('gemini');
      expect(spawnArgs[0]).toBe('/custom/path/to/gemini');
    });

    it('should fallback to next strategy when first strategy fails with unknown option error', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let callCount = 0;
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        callCount++;
        if (callCount === 1) {
          // First strategy (file-arg) fails with unknown option
          return createMockChildProcess(1, '', 'Error: Unknown option --prompt');
        }
        // Second strategy (stdin) succeeds
        return createMockChildProcess(0, aiResponse);
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 5000
      });

      expect(result.success).toBe(true);
      expect(result.toolUsed).toBe('gemini');
      expect(callCount).toBe(2); // Should have tried both strategies
    });

    it('should use argOverrides when provided', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      const aiResponse = JSON.stringify({
        shortDescription: 'Test description',
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      let spawnArgs: any[] = [];
      mockSpawn.mockImplementation((command: string, args: string[]) => {
        spawnArgs = [command, args];
        return createMockChildProcess(0, aiResponse);
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 5000,
        argOverrides: {
          'gemini': ['--custom-flag', '--another-flag']
        }
      });

      expect(result.success).toBe(true);
      expect(result.toolUsed).toBe('gemini');
      // Should use custom args instead of defaults
      expect(spawnArgs[1]).toEqual(['--custom-flag', '--another-flag', expect.stringMatching(/legilimens-prompt-.*\.txt$/)]);
    });

    it('should not retry strategies when argOverride is set and fails', async () => {
      const mockDetect = vi.mocked(cliDetector.detectInstalledCliTools);
      mockDetect.mockReturnValue({
        tools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ],
        availableTools: [
          { name: 'gemini', command: 'gemini', path: '/usr/local/bin/gemini', available: true }
        ]
      });

      const mockSpawn = vi.mocked(spawn);
      let callCount = 0;
      mockSpawn.mockImplementation(() => {
        callCount++;
        return createMockChildProcess(1, '', 'Error: Unknown option --custom-flag');
      });

      const result = await generateWithCliTool('test prompt', {
        preferredTool: 'gemini',
        timeoutMs: 5000,
        argOverrides: {
          'gemini': ['--custom-flag']
        }
      });

      expect(result.success).toBe(false);
      expect(callCount).toBe(1); // Should only try once with override, no fallback
    });
  });
});
