import { CliHelp } from '../../../src/commands/cli-help';

describe('CliHelp', () => {
  let cliHelp: CliHelp;

  beforeEach(() => {
    cliHelp = new CliHelp();
  });

  describe('generateHelp', () => {
    it('should generate main help text', () => {
      const help = cliHelp.generateHelp();

      expect(help).toContain('OneNote to Notion Importer (ONI)');
      expect(help).toContain('USAGE');
      expect(help).toContain('COMMANDS');
      expect(help).toContain('OPTIONS');
      expect(help).toContain('EXAMPLES');
    });

    it('should include all available commands', () => {
      const help = cliHelp.generateHelp();

      expect(help).toContain('import');
      expect(help).toContain('export');
      expect(help).toContain('config');
      expect(help).toContain('help');
    });

    it('should include usage examples', () => {
      const help = cliHelp.generateHelp();

      expect(help).toContain('oni import');
      expect(help).toContain('oni export');
      expect(help).toContain('oni config');
    });
  });

  describe('generateCommandHelp', () => {
    it('should generate help for import command', () => {
      const help = cliHelp.generateCommandHelp('import');

      expect(help).toContain('Import OneNote content to Notion');
      expect(help).toContain('--file');
      expect(help).toContain('--workspace');
      expect(help).toContain('--dry-run');
      expect(help).toContain('EXAMPLES');
    });

    it('should generate help for export command', () => {
      const help = cliHelp.generateCommandHelp('export');

      expect(help).toContain('Export OneNote content to various formats');
      expect(help).toContain('--file');
      expect(help).toContain('--output');
      expect(help).toContain('--format');
      expect(help).toContain('markdown');
      expect(help).toContain('docx');
      expect(help).toContain('json');
    });

    it('should generate help for config command', () => {
      const help = cliHelp.generateCommandHelp('config');

      expect(help).toContain('Manage configuration settings');
      expect(help).toContain('init');
      expect(help).toContain('set');
      expect(help).toContain('get');
      expect(help).toContain('list');
    });

    it('should handle unknown command', () => {
      const help = cliHelp.generateCommandHelp('unknown');

      expect(help).toContain('Unknown command: unknown');
      expect(help).toContain('Available commands');
    });
  });

  describe('generateExamples', () => {
    it('should generate usage examples', () => {
      const examples = cliHelp.generateExamples();

      expect(examples).toContain('EXAMPLES');
      expect(examples).toContain('Basic import');
      expect(examples).toContain('Export to markdown');
      expect(examples).toContain('Dry run mode');
      expect(examples).toContain('Batch processing');
    });

    it('should include command examples', () => {
      const examples = cliHelp.generateExamples();

      expect(examples).toContain('oni import --file notebook.onepkg --workspace workspace-123');
      expect(examples).toContain('oni export --file section.one --output ./exported --format markdown');
      expect(examples).toContain('oni import --file notebook.onepkg --workspace workspace-123 --dry-run');
    });
  });

  describe('generateTroubleshooting', () => {
    it('should generate troubleshooting guide', () => {
      const troubleshooting = cliHelp.generateTroubleshooting();

      expect(troubleshooting).toContain('TROUBLESHOOTING');
      expect(troubleshooting).toContain('Common Issues');
      expect(troubleshooting).toContain('File not found');
      expect(troubleshooting).toContain('Permission denied');
      expect(troubleshooting).toContain('Invalid API key');
    });

    it('should include solutions for common problems', () => {
      const troubleshooting = cliHelp.generateTroubleshooting();

      expect(troubleshooting).toContain('Check that the file path is correct');
      expect(troubleshooting).toContain('Check file permissions');
      expect(troubleshooting).toContain('Get your API key from');
      expect(troubleshooting).toContain('Get your workspace ID from');
    });
  });

  describe('generateConfigurationGuide', () => {
    it('should generate configuration guide', () => {
      const guide = cliHelp.generateConfigurationGuide();

      expect(guide).toContain('CONFIGURATION GUIDE');
      expect(guide).toContain('Getting Started');
      expect(guide).toContain('API key');
      expect(guide).toContain('workspace ID');
      expect(guide).toContain('database ID');
    });

    it('should include step-by-step instructions', () => {
      const guide = cliHelp.generateConfigurationGuide();

      expect(guide).toContain('1. Get your Notion API key');
      expect(guide).toContain('2. Find your workspace ID');
      expect(guide).toContain('3. Create a database');
      expect(guide).toContain('4. Run oni config init');
    });
  });

  describe('generateQuickStart', () => {
    it('should generate quick start guide', () => {
      const quickStart = cliHelp.generateQuickStart();

      expect(quickStart).toContain('QUICK START');
      expect(quickStart).toContain('Installation');
      expect(quickStart).toContain('Configuration');
      expect(quickStart).toContain('First Import');
      expect(quickStart).toContain('Next Steps');
    });

    it('should include installation steps', () => {
      const quickStart = cliHelp.generateQuickStart();

      expect(quickStart).toContain('npm install -g oni');
      expect(quickStart).toContain('oni --version');
    });
  });

  describe('generateCommandReference', () => {
    it('should generate complete command reference', () => {
      const reference = cliHelp.generateCommandReference();

      expect(reference).toContain('COMMAND REFERENCE');
      expect(reference).toContain('oni import');
      expect(reference).toContain('oni export');
      expect(reference).toContain('oni config');
      expect(reference).toContain('oni help');
    });

    it('should include all command options', () => {
      const reference = cliHelp.generateCommandReference();

      expect(reference).toContain('--file, -f');
      expect(reference).toContain('--workspace, -w');
      expect(reference).toContain('--output, -o');
      expect(reference).toContain('--format');
      expect(reference).toContain('--dry-run');
      expect(reference).toContain('--verbose');
    });
  });

  describe('generateInteractiveHelp', () => {
    it('should generate interactive help menu', () => {
      const interactive = cliHelp.generateInteractiveHelp();

      expect(interactive).toContain('INTERACTIVE HELP');
      expect(interactive).toContain('Choose a topic');
      expect(interactive).toContain('1. Quick Start');
      expect(interactive).toContain('2. Configuration');
      expect(interactive).toContain('3. Commands');
      expect(interactive).toContain('4. Troubleshooting');
    });
  });

  describe('searchHelp', () => {
    it('should search help content for keywords', () => {
      const results = cliHelp.searchHelp('import');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.command === 'import')).toBe(true);
      expect(results.some(r => r.description.includes('Import OneNote content'))).toBe(true);
    });

    it('should return multiple results for broad search', () => {
      const results = cliHelp.searchHelp('file');

      expect(results.length).toBeGreaterThan(1);
      expect(results.some(r => r.command === 'import')).toBe(true);
      expect(results.some(r => r.command === 'export')).toBe(true);
    });

    it('should return empty results for no matches', () => {
      const results = cliHelp.searchHelp('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('generateMarkdownDocs', () => {
    it('should generate markdown documentation', () => {
      const docs = cliHelp.generateMarkdownDocs();

      expect(docs).toContain('# OneNote to Notion Importer');
      expect(docs).toContain('## Installation');
      expect(docs).toContain('## Usage');
      expect(docs).toContain('## Commands');
      expect(docs).toContain('## Configuration');
    });

    it('should include code blocks', () => {
      const docs = cliHelp.generateMarkdownDocs();

      expect(docs).toContain('```bash');
      expect(docs).toContain('```');
    });
  });
});
