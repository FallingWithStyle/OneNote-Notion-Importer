import { Command } from 'commander';
import { logger } from '../utils/logger';
import { CommandHelpers } from '../utils/command-helpers';
import { OneNoteService } from '../services/onenote/onenote.service';
import { AdvancedContentConverterService } from '../services/onenote/advanced-content-converter.service';
import path from 'path';
import fs from 'fs';

/**
 * Sanitizes a filename by removing or replacing invalid characters
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // Limit length
}

const exportCommand = new Command('export');

exportCommand
  .description('Export OneNote content to various formats')
  .option('-f, --file <path>', 'Path to OneNote file (.onepkg or .one)')
  .option('-o, --output <path>', 'Output directory for exported files')
  .option('--format <format>', 'Export format (markdown, docx, json)', 'markdown')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      CommandHelpers.logCommandStart('export', 'export');
      CommandHelpers.setupVerboseLogging(options);

      // Load configuration
      const configService = await CommandHelpers.loadConfiguration(options.config);
      const config = await configService.loadConfig(options.config);

      // Validate required options
      CommandHelpers.validateFilePath(options.file, 'export');

      const outputDir = options.output || config.export.outputDirectory || './exported';
      const format = options.format || 'markdown';

      logger.info(`Exporting from: ${options.file}`);
      logger.info(`Output directory: ${outputDir}`);
      logger.info(`Export format: ${format}`);

      // Validate file exists
      if (!fs.existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`);
      }

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        logger.info(`Created output directory: ${outputDir}`);
      }

      // Initialize services
      const oneNoteService = new OneNoteService();
      const contentConverter = new AdvancedContentConverterService();

      // Process OneNote files
      logger.info('Processing OneNote files...');
      const extractionResult = await oneNoteService.processFiles([options.file], {
        includeMetadata: true,
        extractImages: true,
        preserveFormatting: true,
        fallbackOnError: true
      });

      if (!extractionResult.success) {
        throw new Error(`Failed to process OneNote files: ${extractionResult.error || 'Unknown error'}`);
      }

      if (!extractionResult.hierarchy) {
        throw new Error('No hierarchy data extracted from OneNote files');
      }

      logger.info(`Successfully processed ${extractionResult.hierarchy.notebooks.length} notebook(s)`);
      
      // Display hierarchy
      oneNoteService.displayHierarchy(extractionResult.hierarchy, {
        showMetadata: true,
        showContent: false,
        maxDepth: 5
      });

      // Export content
      logger.info(`Exporting content to ${format} format...`);
      let totalPages = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const notebook of extractionResult.hierarchy.notebooks) {
        const notebookDir = path.join(outputDir, sanitizeFileName(notebook.name));
        if (!fs.existsSync(notebookDir)) {
          fs.mkdirSync(notebookDir, { recursive: true });
        }

        for (const section of notebook.sections) {
          const sectionDir = path.join(notebookDir, sanitizeFileName(section.name));
          if (!fs.existsSync(sectionDir)) {
            fs.mkdirSync(sectionDir, { recursive: true });
          }

          for (const page of section.pages) {
            totalPages++;
            try {
              // Convert page content
              const convertedPage = await contentConverter.convertAdvancedPage(page, {
                includeMetadata: true,
                outputFormat: format === 'json' ? 'markdown' : format as 'markdown' | 'docx',
                preserveTables: true,
                preserveCodeBlocks: true,
                handleAttachments: true,
                convertTags: true
              });

              // Generate filename
              const fileName = sanitizeFileName(page.title);
              let filePath: string;
              let content: string;

              switch (format) {
                case 'markdown':
                  filePath = path.join(sectionDir, `${fileName}.md`);
                  content = convertedPage.content || '';
                  break;
                case 'docx':
                  filePath = path.join(sectionDir, `${fileName}.docx`);
                  content = convertedPage.content || '';
                  break;
                case 'json':
                  filePath = path.join(sectionDir, `${fileName}.json`);
                  content = JSON.stringify({
                    id: page.id,
                    title: page.title,
                    content: convertedPage.content,
                    metadata: {
                      createdDate: page.createdDate,
                      lastModifiedDate: page.lastModifiedDate,
                      metadata: page.metadata
                    }
                  }, null, 2);
                  break;
                default:
                  throw new Error(`Unsupported format: ${format}`);
              }

              // Write file
              fs.writeFileSync(filePath, content, 'utf8');
              successCount++;
              logger.debug(`Exported page: ${page.title} -> ${filePath}`);
              
              // Progress indicator
              if (totalPages % 10 === 0) {
                logger.info(`Progress: ${totalPages} pages processed (${successCount} successful, ${errorCount} errors)`);
              }
            } catch (error) {
              errorCount++;
              logger.error(`Failed to export page "${page.title}": ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }

      // Create summary file
      const summaryPath = path.join(outputDir, 'export-summary.json');
      const summary = {
        exportDate: new Date().toISOString(),
        sourceFile: options.file,
        format: format,
        notebooks: extractionResult.hierarchy.notebooks.length,
        totalPages: totalPages,
        successfulPages: successCount,
        failedPages: errorCount,
        errors: extractionResult.error ? [extractionResult.error] : []
      };
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      // Final summary
      logger.info(`Export completed: ${successCount}/${totalPages} pages successfully exported`);
      logger.info(`Summary saved to: ${summaryPath}`);
      if (errorCount > 0) {
        logger.warn(`${errorCount} pages failed to export. Check logs for details.`);
      }

      CommandHelpers.logCommandSuccess('export', 'Export');
      
    } catch (error) {
      CommandHelpers.handleCommandError(error, 'Export');
    }
  });

export { exportCommand };
