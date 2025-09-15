# OneNote to Notion Importer (ONI) - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Command Reference](#command-reference)
6. [GUI Usage](#gui-usage)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Introduction

The OneNote to Notion Importer (ONI) is a powerful, offline-first CLI tool designed to migrate your OneNote content to Notion while preserving your notebook structure and giving you complete control over what gets imported.

### Key Features
- **Offline Processing**: Work with your OneNote files locally without uploading them to external services
- **Structure Preservation**: Maintain your notebook hierarchy, sections, and page relationships
- **Selective Import**: Choose exactly which notebooks, sections, or pages to import
- **Format Support**: Handle both `.one` and `.onepkg` OneNote file formats
- **Rich Content**: Convert text, images, tables, lists, and other OneNote elements
- **Preview Mode**: See exactly what will be imported before making changes
- **Batch Operations**: Process multiple files or notebooks at once
- **GUI Interface**: Optional graphical interface for easier use

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- A Notion account with API access
- OneNote files in `.one` or `.onepkg` format

### Install ONI
```bash
# Install globally
npm install -g oni

# Or install locally
npm install oni
```

### Verify Installation
```bash
oni --version
```

## Quick Start

### 1. Set up Notion Integration
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the API key
4. Create a database in Notion for your imported content
5. Share the database with your integration

### 2. Configure ONI
```bash
oni config --setup
```

Follow the prompts to enter your Notion API key and database ID.

### 3. Import Your First Notebook
```bash
# Import a single OneNote file
oni import path/to/notebook.one

# Import a OneNote package
oni import path/to/notebook.onepkg

# Preview before importing
oni import path/to/notebook.one --dry-run
```

### 4. Select What to Import
```bash
# Interactive selection
oni import path/to/notebook.onepkg --select

# Import specific sections
oni import path/to/notebook.onepkg --sections "Work,Personal"
```

## Configuration

### Configuration File
ONI uses a configuration file located at `~/.oni/config.json` (or `%APPDATA%\.oni\config.json` on Windows).

```json
{
  "notion": {
    "apiKey": "your-notion-api-key",
    "databaseId": "your-database-id",
    "baseUrl": "https://api.notion.com/v1"
  },
  "onenote": {
    "supportedFormats": [".one", ".onepkg"],
    "maxFileSize": 104857600,
    "tempDir": "./temp"
  },
  "output": {
    "format": "markdown",
    "includeMetadata": true,
    "preserveHierarchy": true
  },
  "logging": {
    "level": "info",
    "file": "./logs/oni.log",
    "maxSize": "10MB",
    "maxFiles": 5
  }
}
```

### Environment Variables (Recommended)
For better security, use environment variables instead of storing sensitive data in configuration files:

#### Using .env File
```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env
```

#### Using System Environment Variables
```bash
export NOTION_API_KEY="your-api-key"
export NOTION_WORKSPACE_ID="your-workspace-id"
export NOTION_DATABASE_ID="your-database-id"
```

**Note:** Environment variables override configuration file values, providing a secure way to manage API keys and workspace IDs.

## Command Reference

### Basic Commands

#### `oni import <file>`
Import a OneNote file or package to Notion.

**Options:**
- `--dry-run`: Preview what will be imported without making changes
- `--select`: Interactive selection of what to import
- `--sections <names>`: Import only specified sections (comma-separated)
- `--pages <names>`: Import only specified pages (comma-separated)
- `--output <format>`: Output format (markdown, html, json)
- `--verbose`: Enable verbose logging

**Examples:**
```bash
# Basic import
oni import notebook.one

# Preview mode
oni import notebook.one --dry-run

# Interactive selection
oni import notebook.onepkg --select

# Import specific sections
oni import notebook.onepkg --sections "Work,Personal"
```

#### `oni export <file>`
Export OneNote content to local files without importing to Notion.

**Options:**
- `--format <format>`: Output format (markdown, html, json)
- `--output <dir>`: Output directory
- `--select`: Interactive selection of what to export

**Examples:**
```bash
# Export to markdown
oni export notebook.one --format markdown

# Export to specific directory
oni export notebook.onepkg --output ./exports
```

#### `oni config`
Manage ONI configuration.

**Subcommands:**
- `oni config --setup`: Interactive setup wizard
- `oni config --show`: Display current configuration
- `oni config --set <key> <value>`: Set configuration value
- `oni config --reset`: Reset to default configuration

**Examples:**
```bash
# Setup wizard
oni config --setup

# Show current config
oni config --show

# Set API key
oni config --set notion.apiKey "your-key"
```

#### `oni preview <file>`
Preview OneNote content structure and content.

**Options:**
- `--format <format>`: Preview format (tree, json, markdown)
- `--depth <number>`: Maximum depth to show

**Examples:**
```bash
# Tree view
oni preview notebook.onepkg

# JSON structure
oni preview notebook.one --format json
```

### Advanced Commands

#### `oni batch <directory>`
Process multiple OneNote files in a directory.

**Options:**
- `--pattern <glob>`: File pattern to match
- `--recursive`: Process subdirectories
- `--parallel <number>`: Number of parallel operations

**Examples:**
```bash
# Process all OneNote files
oni batch ./notebooks

# Process with specific pattern
oni batch ./notebooks --pattern "*.onepkg"

# Process recursively
oni batch ./notebooks --recursive
```

#### `oni validate <file>`
Validate OneNote file structure and content.

**Options:**
- `--fix`: Attempt to fix common issues
- `--verbose`: Show detailed validation results

**Examples:**
```bash
# Validate file
oni validate notebook.one

# Validate and fix
oni validate notebook.one --fix
```

## GUI Usage

### Starting the GUI
```bash
oni gui
```

### GUI Features
- **File Browser**: Navigate and select OneNote files
- **Preview Panel**: See content before importing
- **Progress Tracking**: Monitor import progress
- **Log Viewer**: View real-time logs
- **Configuration**: Manage settings through the interface

### GUI Workflow
1. **Select Files**: Use the file browser to select OneNote files
2. **Preview Content**: Review the structure and content in the preview panel
3. **Configure Settings**: Adjust import settings as needed
4. **Start Import**: Click the import button to begin the process
5. **Monitor Progress**: Watch the progress bar and logs for updates

## Troubleshooting

### Common Issues

#### "Notion API Key Not Found"
**Solution:** Run `oni config --setup` to configure your Notion API key.

#### "Database Not Found"
**Solution:** Ensure your Notion database ID is correct and the integration has access to it.

#### "OneNote File Format Not Supported"
**Solution:** Ensure you're using `.one` or `.onepkg` files. Convert other formats if necessary.

#### "Import Failed - Rate Limited"
**Solution:** Wait a few minutes and try again. Notion has rate limits on API calls.

#### "Memory Error During Import"
**Solution:** Try importing smaller sections or pages individually.

### Debug Mode
Enable debug logging for detailed troubleshooting:
```bash
oni import notebook.one --verbose --debug
```

### Log Files
Check log files for detailed error information:
- **Location**: `./logs/oni.log`
- **Levels**: error, warn, info, debug
- **Rotation**: Automatic rotation when files reach 10MB

## FAQ

### Q: Can I import OneNote files without a Notion account?
A: Yes, use the `oni export` command to convert OneNote files to local markdown files.

### Q: Will my OneNote files be modified during import?
A: No, ONI only reads your OneNote files. It never modifies the original files.

### Q: Can I import only specific pages or sections?
A: Yes, use the `--select` option for interactive selection or `--sections`/`--pages` for specific items.

### Q: What happens if the import fails partway through?
A: ONI will log the error and stop. You can resume by running the import again - it will skip already imported content.

### Q: Can I import the same notebook multiple times?
A: Yes, but you may get duplicate content in Notion. Use the `--dry-run` option to preview first.

### Q: How do I handle large notebooks?
A: Use the `--select` option to import sections individually, or use the batch processing features.

### Q: Can I customize the output format?
A: Yes, use the `--output` option to specify markdown, HTML, or JSON format.

### Q: Is my data secure?
A: Yes, ONI processes files locally and only sends content to Notion via the official API. Your OneNote files are never uploaded to external services.

### Q: Can I use ONI with OneNote for Mac/Windows?
A: Yes, ONI works with OneNote files exported from any version of OneNote.

### Q: How do I update ONI?
A: Run `npm update -g oni` to update to the latest version.

## Support

For additional help:
- **Documentation**: [GitHub Wiki](https://github.com/your-repo/oni/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/oni/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/oni/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.
