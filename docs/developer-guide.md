# OneNote to Notion Importer (ONI) - Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Structure](#code-structure)
4. [API Reference](#api-reference)
5. [Testing](#testing)
6. [Contributing](#contributing)
7. [Deployment](#deployment)

## Architecture Overview

ONI is built with a modular, service-oriented architecture that separates concerns and enables easy testing and maintenance.

### Core Components

```
src/
├── commands/          # CLI command implementations
├── services/          # Business logic services
│   ├── notion/        # Notion API integration
│   └── onenote/       # OneNote file processing
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── gui/               # Electron GUI application
```

### Service Layer

- **ConfigService**: Manages configuration and settings
- **OneNoteService**: Handles OneNote file parsing and processing
- **NotionService**: Manages Notion API interactions
- **Logger**: Centralized logging functionality

### Command Layer

- **ImportCommand**: Handles OneNote to Notion import operations
- **ExportCommand**: Handles OneNote to local file export
- **ConfigCommand**: Manages configuration settings
- **PreviewCommand**: Provides content preview functionality

## Development Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn
- Git

### Clone and Install
```bash
git clone https://github.com/your-repo/oni.git
cd oni
npm install
```

### Development Scripts
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Build the application
npm run build

# Start GUI in development mode
npm run dev:gui
```

### Environment Setup
1. Copy the example configuration:
   ```bash
   cp src/config/oni.config.json.example src/config/oni.config.json
   ```

2. Set up your Notion integration:
   - Create a Notion integration at [notion.so/my-integrations](https://notion.so/my-integrations)
   - Create a database for testing
   - Update the configuration with your API key and database ID

3. Set up test data:
   ```bash
   npm run generate-test-data
   ```

## Code Structure

### Services

#### ConfigService
Manages application configuration and settings.

```typescript
class ConfigService {
  async loadConfig(): Promise<Config>
  async saveConfig(config: Config): Promise<void>
  async validateConfig(config: Config): Promise<ValidationResult>
  getConfigPath(): string
}
```

#### OneNoteService
Handles OneNote file processing and content extraction.

```typescript
class OneNoteService {
  async processOneNoteFile(filePath: string): Promise<Notebook>
  async processOneNotePackage(packagePath: string): Promise<Notebook>
  async extractContent(page: Page): Promise<string>
  async extractImages(page: Page): Promise<Image[]>
  async validateFile(filePath: string): Promise<ValidationResult>
}
```

#### NotionService
Manages Notion API interactions and content creation.

```typescript
class NotionService {
  async createPage(databaseId: string, page: NotionPage): Promise<NotionPage>
  async updatePage(pageId: string, page: NotionPage): Promise<NotionPage>
  async getPage(pageId: string): Promise<NotionPage>
  async createDatabase(properties: DatabaseProperties): Promise<Database>
  async uploadImage(imageData: Buffer, filename: string): Promise<string>
}
```

### Types

#### Core Types
```typescript
interface Notebook {
  id: string
  name: string
  sections: Section[]
  pages: Page[]
  metadata: NotebookMetadata
}

interface Section {
  id: string
  name: string
  pages: Page[]
  parentId?: string
}

interface Page {
  id: string
  title: string
  content: string
  sectionId: string
  parentId?: string
  attachments: Attachment[]
  metadata: PageMetadata
}

interface Attachment {
  id: string
  name: string
  type: string
  data: Buffer
  url?: string
}
```

#### Notion Types
```typescript
interface NotionPage {
  parent: { database_id: string } | { page_id: string }
  properties: Record<string, PropertyValue>
  children?: Block[]
}

interface PropertyValue {
  title?: TitlePropertyValue
  rich_text?: RichTextPropertyValue
  select?: SelectPropertyValue
  multi_select?: MultiSelectPropertyValue
  date?: DatePropertyValue
  checkbox?: CheckboxPropertyValue
  url?: URLPropertyValue
  email?: EmailPropertyValue
  phone_number?: PhoneNumberPropertyValue
  number?: NumberPropertyValue
  created_time?: CreatedTimePropertyValue
  created_by?: CreatedByPropertyValue
  last_edited_time?: LastEditedTimePropertyValue
  last_edited_by?: LastEditedByPropertyValue
}
```

### Commands

#### ImportCommand
Handles the import process from OneNote to Notion.

```typescript
class ImportCommand {
  async execute(options: ImportOptions): Promise<ImportResult>
  private async processNotebook(notebook: Notebook): Promise<void>
  private async processSection(section: Section): Promise<void>
  private async processPage(page: Page): Promise<void>
  private async convertToNotionFormat(page: Page): Promise<NotionPage>
}
```

#### ExportCommand
Handles the export process from OneNote to local files.

```typescript
class ExportCommand {
  async execute(options: ExportOptions): Promise<ExportResult>
  private async exportToMarkdown(notebook: Notebook, outputDir: string): Promise<void>
  private async exportToHTML(notebook: Notebook, outputDir: string): Promise<void>
  private async exportToJSON(notebook: Notebook, outputDir: string): Promise<void>
}
```

## API Reference

### OneNoteService API

#### `processOneNoteFile(filePath: string): Promise<Notebook>`
Processes a single OneNote file and returns the notebook structure.

**Parameters:**
- `filePath`: Path to the OneNote file

**Returns:**
- `Promise<Notebook>`: The parsed notebook structure

**Throws:**
- `FileNotFoundError`: If the file doesn't exist
- `InvalidFormatError`: If the file format is not supported
- `ParseError`: If the file cannot be parsed

#### `processOneNotePackage(packagePath: string): Promise<Notebook>`
Processes a OneNote package file and returns the notebook structure.

**Parameters:**
- `packagePath`: Path to the OneNote package file

**Returns:**
- `Promise<Notebook>`: The parsed notebook structure

**Throws:**
- `FileNotFoundError`: If the package doesn't exist
- `InvalidFormatError`: If the package format is not supported
- `ParseError`: If the package cannot be parsed

### NotionService API

#### `createPage(databaseId: string, page: NotionPage): Promise<NotionPage>`
Creates a new page in a Notion database.

**Parameters:**
- `databaseId`: The ID of the Notion database
- `page`: The page data to create

**Returns:**
- `Promise<NotionPage>`: The created page

**Throws:**
- `NotionAPIError`: If the API request fails
- `ValidationError`: If the page data is invalid

#### `uploadImage(imageData: Buffer, filename: string): Promise<string>`
Uploads an image to Notion and returns the URL.

**Parameters:**
- `imageData`: The image data as a Buffer
- `filename`: The filename for the image

**Returns:**
- `Promise<string>`: The URL of the uploaded image

**Throws:**
- `NotionAPIError`: If the upload fails
- `ValidationError`: If the image data is invalid

### ConfigService API

#### `loadConfig(): Promise<Config>`
Loads the configuration from the config file.

**Returns:**
- `Promise<Config>`: The loaded configuration

**Throws:**
- `ConfigError`: If the configuration cannot be loaded

#### `saveConfig(config: Config): Promise<void>`
Saves the configuration to the config file.

**Parameters:**
- `config`: The configuration to save

**Throws:**
- `ConfigError`: If the configuration cannot be saved

## Testing

### Test Structure
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── performance/       # Performance tests
├── stress/           # Stress tests
└── fixtures/         # Test data
```

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:stress

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

#### Unit Tests
Test individual functions and methods in isolation.

```typescript
describe('OneNoteService', () => {
  describe('processOneNoteFile', () => {
    it('should process a valid OneNote file', async () => {
      const service = new OneNoteService();
      const result = await service.processOneNoteFile('test.one');
      
      expect(result).toBeDefined();
      expect(result.pages).toHaveLength(1);
    });
  });
});
```

#### Integration Tests
Test the interaction between different components.

```typescript
describe('Import Flow', () => {
  it('should import OneNote content to Notion', async () => {
    const oneNoteService = new OneNoteService();
    const notionService = new NotionService();
    
    const notebook = await oneNoteService.processOneNoteFile('test.one');
    const notionPage = await notionService.convertOneNotePageToNotion(notebook.pages[0]);
    const createdPage = await notionService.createPage(databaseId, notionPage);
    
    expect(createdPage).toBeDefined();
    expect(createdPage.id).toBeDefined();
  });
});
```

#### Performance Tests
Test the performance characteristics of the application.

```typescript
describe('Performance', () => {
  it('should process large files within time limits', async () => {
    const startTime = Date.now();
    const service = new OneNoteService();
    
    await service.processOneNoteFile('large-notebook.onepkg');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

### Test Data
Use the test data generator to create consistent test data:

```bash
npm run generate-test-data
```

This creates various test files in the `tests/fixtures/onenote/` directory.

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for your changes
5. Run the test suite
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commit Messages
Use conventional commit format:
```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
```

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Update the changelog
5. Request review from maintainers

## Deployment

### Building for Production
```bash
# Build the application
npm run build

# Build for specific platform
npm run build:cli
npm run build:gui
```

### Distribution
The application can be distributed as:
- npm package (CLI only)
- Electron app (GUI)
- Docker container
- Standalone binaries

### Release Process
1. Update version in `package.json`
2. Update changelog
3. Create release tag
4. Build and test
5. Publish to npm
6. Create GitHub release

### Environment Variables
- `NOTION_API_KEY`: Notion API key
- `NOTION_DATABASE_ID`: Default Notion database ID
- `ONI_CONFIG_PATH`: Path to configuration file
- `ONI_LOG_LEVEL`: Logging level (error, warn, info, debug)

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
