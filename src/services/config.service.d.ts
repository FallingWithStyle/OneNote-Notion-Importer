export interface NotionConfig {
    workspaceId?: string | undefined;
    databaseId?: string | undefined;
    apiKey?: string | undefined;
}
export interface ExportConfig {
    outputDirectory: string;
    defaultFormat: 'markdown' | 'docx' | 'json';
    preserveStructure: boolean;
    includeMetadata: boolean;
}
export interface AppConfig {
    notion: NotionConfig;
    export: ExportConfig;
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        file: string;
    };
}
export declare class ConfigService {
    private defaultConfig;
    private configPath;
    constructor();
    private loadEnvironmentVariables;
    private getConfigPath;
    loadConfig(customPath?: string): Promise<AppConfig>;
    saveConfig(config: AppConfig, customPath?: string): Promise<void>;
    initConfig(customPath?: string): Promise<void>;
    setConfigValue(key: string, value: string, customPath?: string): Promise<void>;
    getConfigValue(key: string, customPath?: string): Promise<any>;
    private mergeConfig;
    applyEnvironmentOverrides(config: AppConfig): AppConfig;
}
//# sourceMappingURL=config.service.d.ts.map