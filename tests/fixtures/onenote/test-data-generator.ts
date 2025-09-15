import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../../src/utils/logger';

interface TestDataConfig {
  outputDir: string;
  generateSimple: boolean;
  generateComplex: boolean;
  generateLarge: boolean;
  generateCorrupted: boolean;
}

export class TestDataGenerator {
  private config: TestDataConfig;

  constructor(config: Partial<TestDataConfig> = {}) {
    this.config = {
      outputDir: join(__dirname, 'generated'),
      generateSimple: true,
      generateComplex: true,
      generateLarge: true,
      generateCorrupted: true,
      ...config
    };
  }

  async generateAll(): Promise<void> {
    logger.info('Generating test data sets...');
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }

    if (this.config.generateSimple) {
      await this.generateSimplePage();
      await this.generateBasicNotebook();
    }

    if (this.config.generateComplex) {
      await this.generateComplexNotebook();
      await this.generateHierarchicalNotebook();
      await this.generateNotebookWithImages();
    }

    if (this.config.generateLarge) {
      await this.generateLargeNotebook();
      await this.generatePerformanceTestData();
    }

    if (this.config.generateCorrupted) {
      await this.generateCorruptedFiles();
    }

    logger.info('Test data generation complete!');
  }

  private async generateSimplePage(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Page>
      <one:Title>Simple Test Page</one:Title>
      <one:Content>
        <one:OE>
          <one:T>This is a simple test page with basic content.</one:T>
        </one:OE>
        <one:OE>
          <one:T>It contains multiple paragraphs and basic formatting.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'simple-page.one');
    writeFileSync(filePath, content);
    logger.info(`Generated simple page: ${filePath}`);
  }

  private async generateBasicNotebook(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Name>Test Section</one:Name>
    <one:Page>
      <one:Title>Page 1</one:Title>
      <one:Content>
        <one:OE>
          <one:T>This is the first page of a basic notebook.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
    <one:Page>
      <one:Title>Page 2</one:Title>
      <one:Content>
        <one:OE>
          <one:T>This is the second page with more content.</one:T>
        </one:OE>
        <one:OE>
          <one:T>It includes lists and formatting.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'basic-notebook.onepkg');
    writeFileSync(filePath, content);
    logger.info(`Generated basic notebook: ${filePath}`);
  }

  private async generateComplexNotebook(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Name>Work Projects</one:Name>
    <one:Page>
      <one:Title>Project Alpha</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Project Alpha Overview</one:T>
        </one:OE>
        <one:OE>
          <one:T>This is a complex project with multiple components.</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Tasks</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [ ] Research requirements</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [ ] Design architecture</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [x] Create prototype</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Notes</one:T>
        </one:OE>
        <one:OE>
          <one:T>Important considerations:</one:T>
        </one:OE>
        <one:OE>
          <one:T>1. Performance requirements</one:T>
        </one:OE>
        <one:OE>
          <one:T>2. Security considerations</one:T>
        </one:OE>
        <one:OE>
          <one:T>3. User experience</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
    <one:Page>
      <one:Title>Project Beta</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Project Beta</one:T>
        </one:OE>
        <one:OE>
          <one:T>This is another complex project with different requirements.</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Technical Specifications</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Component | Technology | Status |</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Frontend | React | Complete |</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Backend | Node.js | In Progress |</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Database | PostgreSQL | Planned |</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
  <one:Section>
    <one:Name>Personal Notes</one:Name>
    <one:Page>
      <one:Title>Meeting Notes</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Meeting Notes - 2024-01-15</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Attendees</one:T>
        </one:OE>
        <one:OE>
          <one:T>- John Doe (Project Manager)</one:T>
        </one:OE>
        <one:OE>
          <one:T>- Jane Smith (Developer)</one:T>
        </one:OE>
        <one:OE>
          <one:T>- Bob Johnson (Designer)</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Discussion Points</one:T>
        </one:OE>
        <one:OE>
          <one:T>1. Project timeline review</one:T>
        </one:OE>
        <one:OE>
          <one:T>2. Resource allocation</one:T>
        </one:OE>
        <one:OE>
          <one:T>3. Technical challenges</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Action Items</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [ ] Update project timeline</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [ ] Review technical requirements</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [ ] Schedule follow-up meeting</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'complex-notebook.onepkg');
    writeFileSync(filePath, content);
    logger.info(`Generated complex notebook: ${filePath}`);
  }

  private async generateHierarchicalNotebook(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Name>Chapter 1: Introduction</one:Name>
    <one:Page>
      <one:Title>1.1 Overview</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Chapter 1: Introduction</one:T>
        </one:OE>
        <one:OE>
          <one:T>## 1.1 Overview</one:T>
        </one:OE>
        <one:OE>
          <one:T>This chapter provides an introduction to the topic.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
    <one:Page>
      <one:Title>1.2 Background</one:Title>
      <one:Content>
        <one:OE>
          <one:T>## 1.2 Background</one:T>
        </one:OE>
        <one:OE>
          <one:T>Understanding the background is crucial for this topic.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
    <one:Page>
      <one:Title>1.3 Objectives</one:Title>
      <one:Content>
        <one:OE>
          <one:T>## 1.3 Objectives</one:T>
        </one:OE>
        <one:OE>
          <one:T>The main objectives of this study are:</one:T>
        </one:OE>
        <one:OE>
          <one:T>1. To understand the problem</one:T>
        </one:OE>
        <one:OE>
          <one:T>2. To develop a solution</one:T>
        </one:OE>
        <one:OE>
          <one:T>3. To validate the approach</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
  <one:Section>
    <one:Name>Chapter 2: Methodology</one:Name>
    <one:Page>
      <one:Title>2.1 Research Design</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Chapter 2: Methodology</one:T>
        </one:OE>
        <one:OE>
          <one:T>## 2.1 Research Design</one:T>
        </one:OE>
        <one:OE>
          <one:T>This section describes the research methodology.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
    <one:Page>
      <one:Title>2.2 Data Collection</one:Title>
      <one:Content>
        <one:OE>
          <one:T>## 2.2 Data Collection</one:T>
        </one:OE>
        <one:OE>
          <one:T>Data collection methods and procedures.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
  <one:Section>
    <one:Name>Chapter 3: Results</one:Name>
    <one:Page>
      <one:Title>3.1 Analysis</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Chapter 3: Results</one:T>
        </one:OE>
        <one:OE>
          <one:T>## 3.1 Analysis</one:T>
        </one:OE>
        <one:OE>
          <one:T>Analysis of the collected data.</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'hierarchical-notebook.onepkg');
    writeFileSync(filePath, content);
    logger.info(`Generated hierarchical notebook: ${filePath}`);
  }

  private async generateNotebookWithImages(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Name>Visual Content</one:Name>
    <one:Page>
      <one:Title>Page with Images</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Page with Images</one:T>
        </one:OE>
        <one:OE>
          <one:T>This page contains various types of visual content.</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Screenshots</one:T>
        </one:OE>
        <one:OE>
          <one:T>Here are some screenshots of the application:</one:T>
        </one:OE>
        <one:OE>
          <one:T>![Screenshot 1](images/screenshot1.png)</one:T>
        </one:OE>
        <one:OE>
          <one:T>![Screenshot 2](images/screenshot2.png)</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Diagrams</one:T>
        </one:OE>
        <one:OE>
          <one:T>Architecture diagram:</one:T>
        </one:OE>
        <one:OE>
          <one:T>![Architecture](images/architecture.png)</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Attachments</one:T>
        </one:OE>
        <one:OE>
          <one:T>Project documents:</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [Project Requirements](attachments/requirements.pdf)</one:T>
        </one:OE>
        <one:OE>
          <one:T>- [Design Mockups](attachments/mockups.zip)</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'page-with-images.one');
    writeFileSync(filePath, content);
    logger.info(`Generated notebook with images: ${filePath}`);
  }

  private async generateLargeNotebook(): Promise<void> {
    const sections = [];
    const pages = [];
    
    // Generate 10 sections with 20 pages each
    for (let s = 1; s <= 10; s++) {
      sections.push(`  <one:Section>
    <one:Name>Section ${s}</one:Name>`);
      
      for (let p = 1; p <= 20; p++) {
        const pageContent = this.generateLargePageContent(s, p);
        pages.push(`    <one:Page>
      <one:Title>Page ${s}.${p}</one:Title>
      <one:Content>
${pageContent}
      </one:Content>
    </one:Page>`);
      }
      
      sections.push(`  </one:Section>`);
    }

    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
${sections.join('\n')}
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'large-notebook.onepkg');
    writeFileSync(filePath, content);
    logger.info(`Generated large notebook: ${filePath}`);
  }

  private generateLargePageContent(section: number, page: number): string {
    const content = [];
    
    content.push(`        <one:OE>
          <one:T># Section ${section}, Page ${page}</one:T>
        </one:OE>`);
    
    content.push(`        <one:OE>
          <one:T>This is page ${page} of section ${section} in a large notebook.</one:T>
        </one:OE>`);
    
    // Add multiple paragraphs
    for (let i = 1; i <= 10; i++) {
      content.push(`        <one:OE>
          <one:T>Paragraph ${i}: This is a longer paragraph with more content to test performance with large files. It contains multiple sentences and should provide enough content to make the file size significant for testing purposes.</one:T>
        </one:OE>`);
    }
    
    // Add lists
    content.push(`        <one:OE>
          <one:T>## Key Points</one:T>
        </one:OE>`);
    
    for (let i = 1; i <= 5; i++) {
      content.push(`        <one:OE>
          <one:T>- Point ${i}: Important information about this topic</one:T>
        </one:OE>`);
    }
    
    return content.join('\n');
  }

  private async generatePerformanceTestData(): Promise<void> {
    const content = `<?xml version="1.0" encoding="utf-8"?>
<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">
  <one:Section>
    <one:Name>Performance Test</one:Name>
    <one:Page>
      <one:Title>Performance Test Page</one:Title>
      <one:Content>
        <one:OE>
          <one:T># Performance Test Page</one:T>
        </one:OE>
        <one:OE>
          <one:T>This page is designed to test performance with various content types.</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Large Text Content</one:T>
        </one:OE>
        <one:OE>
          <one:T>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Complex Formatting</one:T>
        </one:OE>
        <one:OE>
          <one:T>**Bold text** and *italic text* and ***bold italic text***</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Tables</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Column 1 | Column 2 | Column 3 |</one:T>
        </one:OE>
        <one:OE>
          <one:T>|----------|----------|----------|</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Data 1   | Data 2   | Data 3   |</one:T>
        </one:OE>
        <one:OE>
          <one:T>| Data 4   | Data 5   | Data 6   |</one:T>
        </one:OE>
        <one:OE>
          <one:T>## Code Blocks</one:T>
        </one:OE>
        <one:OE>
          <one:T>```javascript</one:T>
        </one:OE>
        <one:OE>
          <one:T>function testFunction() {</one:T>
        </one:OE>
        <one:OE>
          <one:T>  console.log('Hello, World!');</one:T>
        </one:OE>
        <one:OE>
          <one:T>  return true;</one:T>
        </one:OE>
        <one:OE>
          <one:T>}</one:T>
        </one:OE>
        <one:OE>
          <one:T>```</one:T>
        </one:OE>
      </one:Content>
    </one:Page>
  </one:Section>
</one:Notebook>`;

    const filePath = join(this.config.outputDir, 'performance-test.one');
    writeFileSync(filePath, content);
    logger.info(`Generated performance test data: ${filePath}`);
  }

  private async generateCorruptedFiles(): Promise<void> {
    // Generate various types of corrupted files
    const corruptedFiles = [
      {
        name: 'corrupted.one',
        content: 'This is not a valid OneNote file'
      },
      {
        name: 'incomplete.one',
        content: '<?xml version="1.0" encoding="utf-8"?>\n<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">\n  <one:Section>\n    <one:Page>\n      <one:Title>Incomplete Page</one:Title>\n      <one:Content>\n        <one:OE>\n          <one:T>This file is incomplete and should cause an error</one:T>\n        </one:OE>\n      </one:Content>\n    </one:Page>\n  </one:Section>\n  <!-- Missing closing tags -->'
      },
      {
        name: 'invalid-xml.one',
        content: '<?xml version="1.0" encoding="utf-8"?>\n<one:Notebook xmlns:one="http://schemas.microsoft.com/office/one/2010/onenote">\n  <one:Section>\n    <one:Page>\n      <one:Title>Invalid XML</one:Title>\n      <one:Content>\n        <one:OE>\n          <one:T>This file has invalid XML structure</one:T>\n        </one:OE>\n      </one:Content>\n    </one:Page>\n  </one:Section>\n</one:Notebook>\n<invalid-tag>This should cause an error</invalid-tag>'
      }
    ];

    for (const file of corruptedFiles) {
      const filePath = join(this.config.outputDir, file.name);
      writeFileSync(filePath, file.content);
      logger.info(`Generated corrupted file: ${filePath}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const generator = new TestDataGenerator();
  generator.generateAll()
    .then(() => {
      logger.info('Test data generation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Test data generation failed:', error);
      process.exit(1);
    });
}
