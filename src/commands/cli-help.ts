export interface HelpSearchResult {
  command: string;
  description: string;
  section: string;
}

export class CliHelp {
  private readonly version = '1.0.0';
  private readonly commands = [
    {
      name: 'import',
      description: 'Import OneNote content to Notion',
      usage: 'oni import --file <path> --workspace <id> [options]',
      options: [
        { name: '--file, -f', description: 'Path to OneNote file (.onepkg or .one)', required: true },
        { name: '--workspace, -w', description: 'Notion workspace ID', required: true },
        { name: '--database, -d', description: 'Notion database ID', required: false },
        { name: '--config, -c', description: 'Path to configuration file', required: false },
        { name: '--dry-run', description: 'Preview what would be imported without actually importing', required: false },
        { name: '--verbose', description: 'Enable verbose logging', required: false }
      ],
      examples: [
        'oni import --file notebook.onepkg --workspace workspace-123',
        'oni import --file section.one --workspace workspace-123 --dry-run',
        'oni import --file notebook.onepkg --workspace workspace-123 --database database-456 --verbose'
      ]
    },
    {
      name: 'export',
      description: 'Export OneNote content to various formats',
      usage: 'oni export --file <path> --output <dir> [options]',
      options: [
        { name: '--file, -f', description: 'Path to OneNote file (.onepkg or .one)', required: true },
        { name: '--output, -o', description: 'Output directory for exported files', required: false },
        { name: '--format', description: 'Export format (markdown, docx, json)', required: false },
        { name: '--config, -c', description: 'Path to configuration file', required: false },
        { name: '--verbose', description: 'Enable verbose logging', required: false }
      ],
      examples: [
        'oni export --file notebook.onepkg --output ./exported',
        'oni export --file section.one --output ./exported --format markdown',
        'oni export --file notebook.onepkg --output ./exported --format json --verbose'
      ]
    },
    {
      name: 'config',
      description: 'Manage configuration settings',
      usage: 'oni config <command> [options]',
      options: [
        { name: 'init', description: 'Initialize configuration file', required: false },
        { name: 'set', description: 'Set configuration value', required: false },
        { name: 'get', description: 'Get configuration value', required: false },
        { name: 'list', description: 'List all configuration values', required: false },
        { name: 'validate', description: 'Validate configuration', required: false }
      ],
      examples: [
        'oni config init',
        'oni config set notion.apiKey secret_1234567890abcdef',
        'oni config get notion.workspaceId',
        'oni config list',
        'oni config validate'
      ]
    },
    {
      name: 'help',
      description: 'Show help information',
      usage: 'oni help [command]',
      options: [
        { name: 'command', description: 'Show help for specific command', required: false }
      ],
      examples: [
        'oni help',
        'oni help import',
        'oni help export',
        'oni help config'
      ]
    }
  ];

  /**
   * Generates main help text
   */
  generateHelp(): string {
    let help = 'OneNote to Notion Importer (ONI) v' + this.version + '\n';
    help += 'A powerful CLI tool for migrating OneNote content to Notion\n\n';

    help += 'USAGE\n';
    help += '  oni <command> [options]\n\n';

    help += 'COMMANDS\n';
    this.commands.forEach(cmd => {
      help += `  ${cmd.name.padEnd(12)} ${cmd.description}\n`;
    });

    help += '\nOPTIONS\n';
    help += '  --help, -h     Show help information\n';
    help += '  --version, -v  Show version information\n';
    help += '  --verbose      Enable verbose logging\n\n';

    help += this.generateExamples();

    return help;
  }

  /**
   * Generates help for a specific command
   */
  generateCommandHelp(commandName: string): string {
    const command = this.commands.find(cmd => cmd.name === commandName);
    
    if (!command) {
      return `Unknown command: ${commandName}\n\nAvailable commands:\n${this.commands.map(cmd => `  ${cmd.name}`).join('\n')}\n`;
    }

    let help = `${command.name.toUpperCase()} COMMAND\n`;
    help += '='.repeat(50) + '\n\n';
    help += `${command.description}\n\n`;

    help += 'USAGE\n';
    help += `  ${command.usage}\n\n`;

    if (command.options && command.options.length > 0) {
      help += 'OPTIONS\n';
      command.options.forEach(option => {
        const required = option.required ? ' (required)' : '';
        help += `  ${option.name.padEnd(20)} ${option.description}${required}\n`;
      });
      help += '\n';
    }

    if (command.examples && command.examples.length > 0) {
      help += 'EXAMPLES\n';
      command.examples.forEach(example => {
        help += `  ${example}\n`;
      });
      help += '\n';
    }

    return help;
  }

  /**
   * Generates usage examples
   */
  generateExamples(): string {
    let examples = 'EXAMPLES\n';
    examples += '='.repeat(20) + '\n\n';

    examples += 'Basic import:\n';
    examples += '  oni import --file notebook.onepkg --workspace workspace-123\n\n';

    examples += 'Export to markdown:\n';
    examples += '  oni export --file section.one --output ./exported --format markdown\n\n';

    examples += 'Dry run mode:\n';
    examples += '  oni import --file notebook.onepkg --workspace workspace-123 --dry-run\n\n';

    examples += 'Batch processing:\n';
    examples += '  oni import --file *.onepkg --workspace workspace-123\n\n';

    examples += 'Configuration:\n';
    examples += '  oni config init\n';
    examples += '  oni config set notion.apiKey secret_1234567890abcdef\n\n';

    return examples;
  }

  /**
   * Generates troubleshooting guide
   */
  generateTroubleshooting(): string {
    let troubleshooting = 'TROUBLESHOOTING\n';
    troubleshooting += '='.repeat(30) + '\n\n';

    troubleshooting += 'Common Issues\n';
    troubleshooting += '-------------\n\n';

    troubleshooting += 'File not found:\n';
    troubleshooting += '  - Check that the file path is correct\n';
    troubleshooting += '  - Ensure the file exists and is accessible\n';
    troubleshooting += '  - Use absolute paths if relative paths don\'t work\n\n';

    troubleshooting += 'Permission denied:\n';
    troubleshooting += '  - Check file permissions\n';
    troubleshooting += '  - Run with appropriate user privileges\n';
    troubleshooting += '  - Ensure output directory is writable\n\n';

    troubleshooting += 'Invalid API key:\n';
    troubleshooting += '  - Get your API key from https://www.notion.so/my-integrations\n';
    troubleshooting += '  - Make sure it starts with "secret_"\n';
    troubleshooting += '  - Verify the key has access to your workspace\n\n';

    troubleshooting += 'Invalid workspace ID:\n';
    troubleshooting += '  - Get your workspace ID from your Notion URL\n';
    troubleshooting += '  - Example: https://www.notion.so/workspace-123\n';
    troubleshooting += '  - Use "workspace-123" as the workspace ID\n\n';

    troubleshooting += 'Connection issues:\n';
    troubleshooting += '  - Check your internet connection\n';
    troubleshooting += '  - Verify Notion API is accessible\n';
    troubleshooting += '  - Check for firewall or proxy issues\n\n';

    return troubleshooting;
  }

  /**
   * Generates configuration guide
   */
  generateConfigurationGuide(): string {
    let guide = 'CONFIGURATION GUIDE\n';
    guide += '='.repeat(30) + '\n\n';

    guide += 'Getting Started\n';
    guide += '---------------\n\n';

    guide += '1. Get your Notion API key:\n';
    guide += '   - Go to https://www.notion.so/my-integrations\n';
    guide += '   - Create a new integration\n';
    guide += '   - Copy the API key (starts with "secret_")\n\n';

    guide += '2. Find your workspace ID:\n';
    guide += '   - Open your Notion workspace\n';
    guide += '   - Copy the workspace ID from the URL\n';
    guide += '   - Example: https://www.notion.so/workspace-123\n\n';

    guide += '3. Create a database:\n';
    guide += '   - Create a new database in your workspace\n';
    guide += '   - Copy the database ID from the URL\n';
    guide += '   - Example: https://www.notion.so/workspace-123/database-456\n\n';

    guide += '4. Run oni config init:\n';
    guide += '   - This creates a configuration file\n';
    guide += '   - Set your API key, workspace ID, and database ID\n\n';

    guide += 'Configuration File\n';
    guide += '------------------\n\n';

    guide += 'The configuration file (.onirc) should look like:\n\n';
    guide += '```json\n';
    guide += '{\n';
    guide += '  "notion": {\n';
    guide += '    "apiKey": "secret_1234567890abcdef",\n';
    guide += '    "workspaceId": "workspace-123",\n';
    guide += '    "databaseId": "database-456"\n';
    guide += '  },\n';
    guide += '  "export": {\n';
    guide += '    "outputDirectory": "./exported",\n';
    guide += '    "format": "markdown"\n';
    guide += '  }\n';
    guide += '}\n';
    guide += '```\n\n';

    return guide;
  }

  /**
   * Generates quick start guide
   */
  generateQuickStart(): string {
    let quickStart = 'QUICK START\n';
    quickStart += '='.repeat(20) + '\n\n';

    quickStart += 'Installation\n';
    quickStart += '------------\n';
    quickStart += 'npm install -g oni\n';
    quickStart += 'oni --version\n\n';

    quickStart += 'Configuration\n';
    quickStart += '-------------\n';
    quickStart += 'oni config init\n';
    quickStart += 'oni config set notion.apiKey secret_1234567890abcdef\n';
    quickStart += 'oni config set notion.workspaceId workspace-123\n';
    quickStart += 'oni config set notion.databaseId database-456\n\n';

    quickStart += 'First Import\n';
    quickStart += '------------\n';
    quickStart += 'oni import --file notebook.onepkg --workspace workspace-123 --dry-run\n';
    quickStart += 'oni import --file notebook.onepkg --workspace workspace-123\n\n';

    quickStart += 'Next Steps\n';
    quickStart += '----------\n';
    quickStart += '- Try exporting to different formats\n';
    quickStart += '- Use batch processing for multiple files\n';
    quickStart += '- Explore advanced configuration options\n\n';

    return quickStart;
  }

  /**
   * Generates complete command reference
   */
  generateCommandReference(): string {
    let reference = 'COMMAND REFERENCE\n';
    reference += '='.repeat(30) + '\n\n';

    this.commands.forEach(command => {
      reference += `oni ${command.name}\n`;
      reference += '-'.repeat(20) + '\n';
      reference += `${command.description}\n\n`;
      reference += `Usage: ${command.usage}\n\n`;
      
      if (command.options && command.options.length > 0) {
        reference += 'Options:\n';
        command.options.forEach(option => {
          reference += `  ${option.name.padEnd(20)} ${option.description}\n`;
        });
        reference += '\n';
      }
    });

    return reference;
  }

  /**
   * Generates interactive help menu
   */
  generateInteractiveHelp(): string {
    let interactive = 'INTERACTIVE HELP\n';
    interactive += '='.repeat(30) + '\n\n';

    interactive += 'Choose a topic:\n\n';
    interactive += '1. Quick Start\n';
    interactive += '2. Configuration\n';
    interactive += '3. Commands\n';
    interactive += '4. Troubleshooting\n';
    interactive += '5. Examples\n';
    interactive += '6. Exit\n\n';

    interactive += 'Enter your choice (1-6): ';

    return interactive;
  }

  /**
   * Searches help content for keywords
   */
  searchHelp(keyword: string): HelpSearchResult[] {
    const results: HelpSearchResult[] = [];
    const searchTerm = keyword.toLowerCase();

    this.commands.forEach(command => {
      if (command.name.toLowerCase().includes(searchTerm) ||
          command.description.toLowerCase().includes(searchTerm)) {
        results.push({
          command: command.name,
          description: command.description,
          section: 'commands'
        });
      }

      if (command.options) {
        command.options.forEach(option => {
          if (option.name.toLowerCase().includes(searchTerm) ||
              option.description.toLowerCase().includes(searchTerm)) {
            results.push({
              command: command.name,
              description: `${option.name}: ${option.description}`,
              section: 'options'
            });
          }
        });
      }
    });

    return results;
  }

  /**
   * Generates markdown documentation
   */
  generateMarkdownDocs(): string {
    let docs = '# OneNote to Notion Importer (ONI)\n\n';
    docs += 'A powerful CLI tool for migrating OneNote content to Notion.\n\n';

    docs += '## Installation\n\n';
    docs += '```bash\n';
    docs += 'npm install -g oni\n';
    docs += '```\n\n';

    docs += '## Usage\n\n';
    docs += '```bash\n';
    docs += 'oni <command> [options]\n';
    docs += '```\n\n';

    docs += '## Commands\n\n';
    this.commands.forEach(command => {
      docs += `### ${command.name}\n\n`;
      docs += `${command.description}\n\n`;
      docs += `**Usage:** \`${command.usage}\`\n\n`;
      
      if (command.options && command.options.length > 0) {
        docs += '**Options:**\n\n';
        command.options.forEach(option => {
          const required = option.required ? ' *(required)*' : '';
          docs += `- \`${option.name}\`: ${option.description}${required}\n`;
        });
        docs += '\n';
      }
    });

    docs += '## Configuration\n\n';
    docs += 'Create a configuration file with:\n\n';
    docs += '```bash\n';
    docs += 'oni config init\n';
    docs += '```\n\n';

    docs += '## Examples\n\n';
    docs += '```bash\n';
    docs += '# Import OneNote to Notion\n';
    docs += 'oni import --file notebook.onepkg --workspace workspace-123\n\n';
    docs += '# Export to markdown\n';
    docs += 'oni export --file section.one --output ./exported --format markdown\n\n';
    docs += '# Dry run mode\n';
    docs += 'oni import --file notebook.onepkg --workspace workspace-123 --dry-run\n';
    docs += '```\n\n';

    return docs;
  }

  /**
   * Gets all available commands
   */
  getCommands(): string[] {
    return this.commands.map(cmd => cmd.name);
  }

  /**
   * Gets command information
   */
  getCommandInfo(commandName: string): any {
    return this.commands.find(cmd => cmd.name === commandName);
  }
}
