import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const cliPath = path.join(__dirname, '../../dist/index.js');
const testTimeout = 30000;

describe('Command Integration Tests', () => {

  beforeAll(() => {
    // Ensure CLI is built
    if (!fs.existsSync(cliPath)) {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });

  describe('Import Command', () => {
    it('should process OneNote files and show hierarchy', async () => {
      const result = await runCommand(['import', '--file', 'tests/fixtures/onenote/sample.one', '--workspace', 'test-workspace', '--dry-run', '--verbose']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Processing OneNote files...');
      expect(result.stdout).toContain('Successfully processed');
      expect(result.stdout).toContain('DRY RUN: Would import the following structure to Notion:');
    }, testTimeout);

    it('should handle file not found error', async () => {
      const result = await runCommand(['import', '--file', 'nonexistent.one', '--workspace', 'test-workspace']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('File not found');
    }, testTimeout);

    it('should require workspace ID', async () => {
      const result = await runCommand(['import', '--file', 'tests/fixtures/onenote/sample.one']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Notion workspace ID is required');
    }, testTimeout);

    it('should process .onepkg files', async () => {
      const result = await runCommand(['import', '--file', 'tests/fixtures/onenote/sample.onepkg', '--workspace', 'test-workspace', '--dry-run', '--verbose']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Processing OneNote files...');
      expect(result.stdout).toContain('Successfully processed');
    }, testTimeout);
  });

  describe('Export Command', () => {
    const testOutputDir = path.join(__dirname, '../temp-export');

    beforeEach(() => {
      // Clean up test output directory
      if (fs.existsSync(testOutputDir)) {
        fs.rmSync(testOutputDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up test output directory
      if (fs.existsSync(testOutputDir)) {
        fs.rmSync(testOutputDir, { recursive: true });
      }
    });

    it('should export OneNote files to markdown', async () => {
      const result = await runCommand(['export', '--file', 'tests/fixtures/onenote/sample.one', '--output', testOutputDir, '--format', 'markdown', '--verbose']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Processing OneNote files...');
      expect(result.stdout).toContain('Exporting content to markdown format...');
      expect(result.stdout).toContain('Export completed:');
      
      // Check that files were created
      expect(fs.existsSync(testOutputDir)).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'export-summary.json'))).toBe(true);
    }, testTimeout);

    it('should export to JSON format', async () => {
      const result = await runCommand(['export', '--file', 'tests/fixtures/onenote/sample.one', '--output', testOutputDir, '--format', 'json', '--verbose']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Exporting content to json format...');
      expect(result.stdout).toContain('Export completed:');
      
      // Check that files were created
      expect(fs.existsSync(testOutputDir)).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'export-summary.json'))).toBe(true);
    }, testTimeout);

    it('should handle file not found error', async () => {
      const result = await runCommand(['export', '--file', 'nonexistent.one', '--output', testOutputDir]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('File not found');
    }, testTimeout);

    it('should create output directory if it does not exist', async () => {
      const newOutputDir = path.join(testOutputDir, 'new-dir');
      const result = await runCommand(['export', '--file', 'tests/fixtures/onenote/sample.one', '--output', newOutputDir, '--format', 'markdown']);
      
      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(newOutputDir)).toBe(true);
      expect(result.stdout).toContain('Created output directory');
    }, testTimeout);
  });

  describe('Config Command', () => {
    const testConfigPath = path.join(__dirname, '../temp-config.json');

    beforeEach(() => {
      // Clean up test config file
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
    });

    afterEach(() => {
      // Clean up test config file
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
    });

    it('should initialize configuration file', async () => {
      const result = await runCommand(['config', '--init', '--config', testConfigPath]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Initializing configuration file...');
      expect(result.stdout).toContain('Configuration file created successfully!');
      expect(fs.existsSync(testConfigPath)).toBe(true);
    }, testTimeout);

    it('should set and get configuration values', async () => {
      // Initialize config
      await runCommand(['config', '--init', '--config', testConfigPath]);
      
      // Set a value
      const setResult = await runCommand(['config', '--set', 'notion.token=test-token', '--config', testConfigPath]);
      expect(setResult.exitCode).toBe(0);
      expect(setResult.stdout).toContain('Set notion.token = test-token');
      
      // Get the value
      const getResult = await runCommand(['config', '--get', 'notion.token', '--config', testConfigPath]);
      expect(getResult.exitCode).toBe(0);
      expect(getResult.stdout).toContain('notion.token = test-token');
    }, testTimeout);

    it('should list configuration values', async () => {
      // Initialize config
      await runCommand(['config', '--init', '--config', testConfigPath]);
      
      // List config
      const result = await runCommand(['config', '--list', '--config', testConfigPath]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current configuration:');
      expect(result.stdout).toContain('notion');
      expect(result.stdout).toContain('export');
    }, testTimeout);

    it('should validate configuration', async () => {
      // Initialize config
      await runCommand(['config', '--init', '--config', testConfigPath]);
      
      // Validate config (should fail with missing required values)
      const result = await runCommand(['config', '--validate', '--config', testConfigPath]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Configuration validation failed');
      expect(result.stderr).toContain('Notion API key is required');
    }, testTimeout);

    it('should handle invalid set format', async () => {
      // Initialize config
      await runCommand(['config', '--init', '--config', testConfigPath]);
      
      // Try to set with invalid format
      const result = await runCommand(['config', '--set', 'invalidformat', '--config', testConfigPath]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid format. Use: --set key=value');
    }, testTimeout);
  });

  describe('Help Commands', () => {
    it('should show main help', async () => {
      const result = await runCommand(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OneNote to Notion Importer (ONI)');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('import');
      expect(result.stdout).toContain('export');
      expect(result.stdout).toContain('config');
    }, testTimeout);

    it('should show import help', async () => {
      const result = await runCommand(['import', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Import OneNote content to Notion');
      expect(result.stdout).toContain('--file');
      expect(result.stdout).toContain('--workspace');
      expect(result.stdout).toContain('--dry-run');
    }, testTimeout);

    it('should show export help', async () => {
      const result = await runCommand(['export', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Export OneNote content to various formats');
      expect(result.stdout).toContain('--file');
      expect(result.stdout).toContain('--output');
      expect(result.stdout).toContain('--format');
    }, testTimeout);

    it('should show config help', async () => {
      const result = await runCommand(['config', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Manage configuration settings');
      expect(result.stdout).toContain('--init');
      expect(result.stdout).toContain('--set');
      expect(result.stdout).toContain('--get');
      expect(result.stdout).toContain('--list');
      expect(result.stdout).toContain('--validate');
    }, testTimeout);
  });

  describe('Version Command', () => {
    it('should show version', async () => {
      const result = await runCommand(['--version']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    }, testTimeout);
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
