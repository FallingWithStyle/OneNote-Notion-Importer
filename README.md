# OneNote to Notion Importer (ONI)

**Project ID**: ONI-001  
**Version**: 1.0.0  
**Last Updated**: 2025-09-14

A powerful, offline-first CLI tool for migrating OneNote content to Notion while preserving your notebook structure and giving you complete control over what gets imported.

## Overview

OneNote to Notion Importer (ONI) is a local, cross-platform tool that converts OneNote files (.onepkg/.one) to Notion-compatible formats and imports them via the Notion API. The tool runs completely offline, ensuring your data never leaves your machine, and provides granular control over which notebooks, sections, or pages you want to migrate.

## Features

- **Offline Operation**: Works completely locally with no third-party servers
- **Multiple Input Formats**: Supports .onepkg notebook packages and individual .one section files
- **Flexible Output**: Export to local markdown/HTML files or import directly to Notion
- **Hierarchy Preservation**: Maintains notebook → section → page structure in Notion
- **Selective Import**: Choose exactly which content to migrate
- **Progress Tracking**: Real-time progress indicators and detailed logging
- **Configuration Management**: Save settings and API keys for repeated use
- **Dry-Run Mode**: Preview imports before executing them
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Notion API integration token
- OneNote files (.onepkg or .one) to migrate

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/oni.git
cd oni

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

## Usage

### Basic CLI Usage

```bash
# Import a OneNote package to Notion
oni import --file notebook.onepkg --workspace YOUR_WORKSPACE_ID

# Export to local markdown files
oni export --file notebook.onepkg --output ./exported-content

# Preview what will be imported (dry-run)
oni import --file notebook.onepkg --workspace YOUR_WORKSPACE_ID --dry-run

# Select specific notebooks/sections to import
oni import --file notebook.onepkg --workspace YOUR_WORKSPACE_ID --select
```

### Configuration File

Create a `.onenote2notionrc` file in your home directory:

```json
{
  "notion": {
    "workspaceId": "your_workspace_id",
    "apiKey": "your_notion_integration_token"
  },
  "export": {
    "outputDirectory": "./exported",
    "defaultFormat": "markdown",
    "preserveStructure": true,
    "includeMetadata": true
  },
  "logging": {
    "level": "info",
    "file": "./logs/app.log"
  }
}
```

### GUI Mode (Optional)

```bash
# Launch the graphical interface
oni gui
```

## Project Structure

```
/oni
  ├── src/
  │   ├── commands/      # CLI command implementations
  │   ├── services/      # Business logic services
  │   ├── types/         # TypeScript type definitions
  │   └── utils/         # Shared utilities (logging, etc.)
  ├── tests/
  │   ├── unit/          # Unit tests
  │   ├── integration/   # Integration tests
  │   └── fixtures/      # Test data and sample files
  ├── dist/              # Compiled JavaScript output
  ├── logs/              # Application logs
  ├── README.md          # Project overview (this file)
  ├── PRD.md            # Product Requirements Document
  ├── task-list.md      # Development task list
  ├── package.json
  ├── tsconfig.json
  └── jest.config.js
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Building

```bash
# Build TypeScript
npm run build

# Build for production
npm run build:prod

# Build GUI
npm run build:gui
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Test-Driven Development (TDD)**: Follow the Red-Green-Refactor cycle
  - Red: Write a failing test to define desired behavior
  - Green: Write the simplest code to make the test pass
  - Refactor: Clean up code while keeping tests passing
- Write unit tests for all new functionality before implementation
- Use TypeScript for type safety and better code quality
- Follow the existing code style and conventions
- Maintain > 90% test coverage for core modules
- Update documentation for new features

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Notion API](https://developers.notion.com/) for providing the integration platform
- [ConvertOneNote2MarkDown](https://github.com/OneNoteDev/ConvertOneNote2MarkDown) for OneNote conversion inspiration
- [Commander.js](https://github.com/tj/commander.js) for CLI framework
- [Electron](https://www.electronjs.org/) for cross-platform GUI capabilities