import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('CLI Integration Tests', () => {
  const cliPath = path.join(__dirname, '../../dist/index.js');

  beforeAll(() => {
    // Ensure the CLI is built
    expect(fs.existsSync(cliPath)).toBe(true);
  });

  describe('Help Commands', () => {
    it('should show main help', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OneNote to Notion Importer (ONI)');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('import');
      expect(result.stdout).toContain('export');
      expect(result.stdout).toContain('config');
    });

    it('should show import help', async () => {
      const result = await runCLI(['import', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Import OneNote content to Notion');
      expect(result.stdout).toContain('--file');
      expect(result.stdout).toContain('--workspace');
    });

    it('should show export help', async () => {
      const result = await runCLI(['export', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Export OneNote content to various formats');
      expect(result.stdout).toContain('--file');
      expect(result.stdout).toContain('--output');
    });

    it('should show config help', async () => {
      const result = await runCLI(['config', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Manage configuration settings');
      expect(result.stdout).toContain('--init');
      expect(result.stdout).toContain('--set');
    });
  });

  describe('Error Handling', () => {
    it('should require file path for import', async () => {
      const result = await runCLI(['import']);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('OneNote file path is required');
    });

    it('should require file path for export', async () => {
      const result = await runCLI(['export']);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('OneNote file path is required');
    });

    it('should require workspace ID for import when not in config', async () => {
      const result = await runCLI(['import', '--file', 'test.onepkg']);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Notion workspace ID is required');
    });
  });

  describe('Config Command', () => {
    it('should initialize config file', async () => {
      const tempConfigPath = path.join(__dirname, '../fixtures/temp-config.json');
      
      try {
        const result = await runCLI(['config', '--init', '--config', tempConfigPath]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Configuration file created successfully');
        
        // Verify config file was created
        expect(fs.existsSync(tempConfigPath)).toBe(true);
        
        const configContent = JSON.parse(fs.readFileSync(tempConfigPath, 'utf8'));
        expect(configContent).toHaveProperty('notion');
        expect(configContent).toHaveProperty('export');
        expect(configContent).toHaveProperty('logging');
      } finally {
        // Clean up
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
      }
    });

    it('should set and get config values', async () => {
      const tempConfigPath = path.join(__dirname, '../fixtures/temp-config.json');
      
      try {
        // Initialize config
        await runCLI(['config', '--init', '--config', tempConfigPath]);
        
        // Set a value
        const setResult = await runCLI(['config', '--set', 'notion.workspaceId=test-workspace', '--config', tempConfigPath]);
        expect(setResult.exitCode).toBe(0);
        expect(setResult.stdout).toContain('Set notion.workspaceId = test-workspace');
        
        // Get the value
        const getResult = await runCLI(['config', '--get', 'notion.workspaceId', '--config', tempConfigPath]);
        expect(getResult.exitCode).toBe(0);
        expect(getResult.stdout).toContain('notion.workspaceId = test-workspace');
      } finally {
        // Clean up
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
      }
    });
  });

  describe('Version Command', () => {
    it('should show version', async () => {
      const result = await runCLI(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });
});

// Helper function to run CLI commands
function runCLI(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, '../../dist/index.js');
    const child = spawn('node', [cliPath, ...args], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..')
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
  });
}
