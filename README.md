# OneNote to Notion Importer

A powerful, offline-first CLI tool for migrating OneNote content to Notion while preserving your notebook structure and giving you complete control over what gets imported.

## Overview

OneNote to Notion Importer is a local, cross-platform tool that converts OneNote files (.onepkg/.one) to Notion-compatible formats and imports them via the Notion API. The tool runs completely offline, ensuring your data never leaves your machine, and provides granular control over which notebooks, sections, or pages you want to migrate.

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
git clone https://github.com/your-org/onenote2notion.git
cd onenote2notion

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
onenote2notion import --input notebook.onepkg --notion-token YOUR_TOKEN

# Export to local markdown files
onenote2notion export --input notebook.onepkg --output ./exported-content

# Preview what will be imported (dry-run)
onenote2notion import --input notebook.onepkg --dry-run

# Select specific notebooks/sections to import
onenote2notion import --input notebook.onepkg --select
```

### Configuration File

Create a `.onenote2notionrc` file in your home directory:

```json
{
  "notionToken": "your_notion_integration_token",
  "defaultWorkspace": "your_workspace_id",
  "outputFormat": "markdown",
  "logLevel": "info"
}
```

### GUI Mode (Optional)

```bash
# Launch the graphical interface
onenote2notion gui
```

## Project Structure

```
/onenote2notion
  ├── src/
  │   ├── cli/           # Command-line interface
  │   ├── converter/     # OneNote file conversion logic
  │   ├── notion/        # Notion API integration
  │   ├── gui/           # Electron GUI wrapper
  │   └── utils/         # Shared utilities
  ├── tests/             # Unit and integration tests
  ├── docs/              # Documentation
  ├── examples/          # Sample OneNote files for testing
  ├── README.md          # Project overview (this file)
  ├── PRD.md            # Product Requirements Document
  ├── task-list.md      # Development task list
  └── package.json
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