import { Command } from 'commander';
import { logger } from '../utils/logger';
import { CommandHelpers } from '../utils/command-helpers';
import { OneNoteService } from '../services/onenote/onenote.service';
import { NotionApiService } from '../services/notion/notion-api.service';
import { HierarchyMappingService } from '../services/notion/hierarchy-mapping.service';
import { AdvancedContentConverterService } from '../services/onenote/advanced-content-converter.service';
import path from 'path';
import fs from 'fs';

const importCommand = new Command('import');

importCommand
  .description('Import OneNote content to Notion')
  .option('-f, --file <path>', 'Path to OneNote file (.onepkg or .one)')
  .option('-w, --workspace <id>', 'Notion workspace ID')
  .option('-d, --database <id>', 'Notion database ID')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--dry-run', 'Preview what would be imported without actually importing')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      CommandHelpers.logCommandStart('import', 'import');
      CommandHelpers.setupVerboseLogging(options);

      // Load configuration
      const configService = await CommandHelpers.loadConfiguration(options.config);
      const config = await configService.loadConfig(options.config);

      // Validate required options
      CommandHelpers.validateFilePath(options.file, 'import');
      CommandHelpers.validateWorkspaceId(options.workspace, config.notion.workspaceId);

      logger.info(`Importing from: ${options.file}`);
      logger.info(`Target workspace: ${options.workspace || config.notion.workspaceId}`);
      
      if (options.dryRun) {
        CommandHelpers.logDryRunMode();
      }

      // Validate file exists
      if (!fs.existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`);
      }

      // Initialize services
      const oneNoteService = new OneNoteService();
      const notionApiService = new NotionApiService();
      const hierarchyMappingService = new HierarchyMappingService();
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

      if (options.dryRun) {
        logger.info('DRY RUN: Would import the following structure to Notion:');
        logger.info(`- ${extractionResult.hierarchy.notebooks.length} notebook(s)`);
        const totalSections = extractionResult.hierarchy.notebooks.reduce((sum: number, nb) => sum + nb.sections.length, 0);
        const totalPages = extractionResult.hierarchy.notebooks.reduce((sum: number, nb) => 
          sum + nb.sections.reduce((sectionSum: number, section) => sectionSum + section.pages.length, 0), 0);
        logger.info(`- ${totalSections} section(s)`);
        logger.info(`- ${totalPages} page(s)`);
        CommandHelpers.logCommandSuccess('import', 'Import');
        return;
      }

      // Initialize Notion API
      const workspaceId = options.workspace || config.notion.workspaceId;
      const databaseId = options.database || config.notion.databaseId;
      
      logger.info('Initializing Notion API connection...');
      await notionApiService.initialize({
        integrationToken: config.notion.apiKey || '',
        workspaceId: workspaceId,
        databaseId: databaseId
      });

      // Test connection
      const connectionTest = await notionApiService.testConnection();
      if (!connectionTest) {
        throw new Error('Failed to connect to Notion API. Please check your token and workspace ID.');
      }

      logger.info('Successfully connected to Notion API');

      // Map hierarchy to Notion structure
      logger.info('Mapping OneNote hierarchy to Notion structure...');
      const notionMapping = await hierarchyMappingService.mapHierarchy(extractionResult.hierarchy.notebooks, {
        createDatabases: true,
        maxDepth: 10
      });

      // Convert content and create pages
      logger.info('Converting content and creating Notion pages...');
      let totalPages = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const notebook of extractionResult.hierarchy.notebooks) {
        for (const section of notebook.sections) {
          for (const page of section.pages) {
            totalPages++;
            try {
              // Convert page content
              const convertedPage = await contentConverter.convertAdvancedPage(page, {
                includeMetadata: true,
                outputFormat: 'notion',
                preserveTables: true,
                preserveCodeBlocks: true,
                handleAttachments: true,
                convertTags: true
              });

              // Create Notion page
              const notionPageId = await notionApiService.createPage({
                id: page.id,
                title: page.title,
                content: convertedPage.content || '',
                properties: convertedPage.metadata || {},
                children: [],
                metadata: {
                  createdDate: page.createdDate,
                  lastModifiedDate: page.lastModifiedDate
                }
              }, workspaceId);

              successCount++;
              logger.debug(`Created page: ${page.title} (ID: ${notionPageId})`);
              
              // Progress indicator
              if (totalPages % 10 === 0) {
                logger.info(`Progress: ${totalPages} pages processed (${successCount} successful, ${errorCount} errors)`);
              }
            } catch (error) {
              errorCount++;
              logger.error(`Failed to create page "${page.title}": ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }

      // Final summary
      logger.info(`Import completed: ${successCount}/${totalPages} pages successfully imported`);
      if (errorCount > 0) {
        logger.warn(`${errorCount} pages failed to import. Check logs for details.`);
      }

      CommandHelpers.logCommandSuccess('import', 'Import');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Import failed: ${errorMessage}`);
      process.exit(1);
    }
  });

export { importCommand };
