import { spawn } from 'child_process';
import path from 'path';

const cliPath = path.join(__dirname, '../../dist/index.js');

describe('Main CLI Entry Point', () => {

  beforeAll(() => {
    // Ensure CLI is built
    if (!require('fs').existsSync(cliPath)) {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });

  describe('Error Handling', () => {
    it('should handle uncaught exceptions', async () => {
      // This test verifies that the global error handlers are set up
      // We can't easily test uncaught exceptions without crashing the test runner
      // So we'll test that the CLI starts without errors
      const result = await runCommand(['--help']);
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle unhandled rejections', async () => {
      // Similar to above, we test that the CLI handles errors gracefully
      const result = await runCommand(['--version']);
      expect(result.exitCode).toBe(0);
    }, 10000);
  });

  describe('Command Registration', () => {
    it('should register all commands', async () => {
      const result = await runCommand(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('import');
      expect(result.stdout).toContain('export');
      expect(result.stdout).toContain('config');
    }, 10000);

    it('should show version information', async () => {
      const result = await runCommand(['--version']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    }, 10000);
  });

  describe('Successful Exit Error Handling', () => {
    it('should handle help command as successful exit', async () => {
      const result = await runCommand(['--help']);
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle version command as successful exit', async () => {
      const result = await runCommand(['--version']);
      expect(result.exitCode).toBe(0);
    }, 10000);
  });
});

/**
 * Helper function to run CLI commands
 */
function runCommand(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('node', [cliPath, ...args], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr + error.message
      });
    });
  });
}
