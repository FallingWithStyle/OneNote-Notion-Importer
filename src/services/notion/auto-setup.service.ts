/**
 * Auto Setup Service
 * Automatically creates workspaces and databases for OneNote imports
 */

import { NotionApiService, NotionConfig } from './notion-api.service';
import { logger } from '../../utils/logger';

export interface AutoSetupOptions {
  workspaceName?: string;
  databaseName?: string;
  createIfNotExists?: boolean;
}

export interface AutoSetupResult {
  success: boolean;
  workspaceId?: string;
  databaseId?: string;
  error?: string;
}

export class AutoSetupService {
  private notionApi: NotionApiService;

  constructor(notionApi: NotionApiService) {
    this.notionApi = notionApi;
  }

  /**
   * Automatically set up workspace and database for OneNote import
   * @param config Notion configuration
   * @param options Auto setup options
   * @returns Auto setup result
   */
  async setupWorkspaceAndDatabase(
    config: NotionConfig, 
    options: AutoSetupOptions = {}
  ): Promise<AutoSetupResult> {
    try {
      logger.info('Starting automatic workspace and database setup...');

      // Initialize the Notion API
      const initialized = await this.notionApi.initialize(config);
      if (!initialized) {
        throw new Error('Failed to initialize Notion API');
      }

      // Test connection
      const connected = await this.notionApi.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Notion API. Please check your API key.');
      }

      logger.info('Successfully connected to Notion API');

      // Set up workspace
      const workspaceName = options.workspaceName || 'OneNote Import Workspace';
      let workspaceId: string;

      if (config.workspaceId) {
        workspaceId = config.workspaceId;
        logger.info(`Using existing workspace ID: ${workspaceId}`);
      } else {
        workspaceId = await this.notionApi.findOrCreateWorkspace(workspaceName);
        logger.info(`Found/created workspace: ${workspaceName} (ID: ${workspaceId})`);
      }

      // Set up database
      const databaseName = options.databaseName || 'OneNote Import Database';
      let databaseId: string;

      if (config.databaseId) {
        databaseId = config.databaseId;
        logger.info(`Using existing database ID: ${databaseId}`);
      } else {
        databaseId = await this.notionApi.findOrCreateDatabase(databaseName, workspaceId);
        logger.info(`Found/created database: ${databaseName} (ID: ${databaseId})`);
      }

      // Set up database properties for OneNote import
      const propertiesSet = await this.notionApi.setupDatabaseProperties(databaseId);
      if (propertiesSet) {
        logger.info('Database properties configured for OneNote import');
      }

      return {
        success: true,
        workspaceId,
        databaseId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Auto setup failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get setup status and recommendations
   * @param config Notion configuration
   * @returns Setup status information
   */
  async getSetupStatus(config: NotionConfig): Promise<{
    hasApiKey: boolean;
    hasWorkspace: boolean;
    hasDatabase: boolean;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    const hasApiKey = !!(config.integrationToken && config.integrationToken.trim() !== '');
    const hasWorkspace = !!config.workspaceId;
    const hasDatabase = !!config.databaseId;

    if (!hasApiKey) {
      recommendations.push('Set NOTION_API_KEY in your .env file or configuration');
    }

    if (!hasWorkspace) {
      recommendations.push('Workspace will be auto-created or use existing default workspace');
    }

    if (!hasDatabase) {
      recommendations.push('Database will be auto-created with name "OneNote Import Database"');
    }

    return {
      hasApiKey,
      hasWorkspace,
      hasDatabase,
      recommendations
    };
  }
}
