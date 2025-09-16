export * from './onenote';
export interface OneNoteNotebook {
    id: string;
    name: string;
    sections: OneNoteSection[];
    createdTime: Date;
    lastModifiedTime: Date;
}
export interface OneNoteSection {
    id: string;
    name: string;
    pages: OneNotePage[];
    createdTime: Date;
    lastModifiedTime: Date;
}
export interface OneNotePage {
    id: string;
    name: string;
    content: OneNoteContent;
    createdTime: Date;
    lastModifiedTime: Date;
    tags?: string[];
}
export interface OneNoteContent {
    text: string;
    images: OneNoteImage[];
    attachments: OneNoteAttachment[];
    tables: OneNoteTable[];
    lists: OneNoteList[];
}
export interface OneNoteImage {
    id: string;
    name: string;
    path: string;
    width?: number;
    height?: number;
    alt?: string;
}
export interface OneNoteAttachment {
    id: string;
    name: string;
    path: string;
    size: number;
    mimeType: string;
}
export interface OneNoteTable {
    id: string;
    rows: OneNoteTableRow[];
    columns: number;
}
export interface OneNoteTableRow {
    cells: OneNoteTableCell[];
}
export interface OneNoteTableCell {
    content: string;
    colspan?: number;
    rowspan?: number;
}
export interface OneNoteList {
    id: string;
    type: 'ordered' | 'unordered';
    items: OneNoteListItem[];
}
export interface OneNoteListItem {
    text: string;
    level: number;
    children?: OneNoteListItem[];
}
export interface NotionPage {
    id: string;
    title: string;
    content: NotionContent;
    properties: Record<string, any>;
    children: NotionBlock[];
    createdTime: Date;
    lastEditedTime: Date;
}
export interface NotionContent {
    blocks: NotionBlock[];
}
export interface NotionBlock {
    id: string;
    type: string;
    content: any;
    children?: NotionBlock[];
}
export interface NotionImage {
    type: 'external' | 'file';
    external?: {
        url: string;
    };
    file?: {
        url: string;
        expiry_time: string;
    };
}
export interface ConversionOptions {
    preserveStructure: boolean;
    includeMetadata: boolean;
    outputFormat: 'markdown' | 'docx' | 'json';
    imageHandling: 'embed' | 'upload' | 'link';
    tableHandling: 'preserve' | 'convert' | 'skip';
}
export interface ConversionResult {
    success: boolean;
    pagesConverted: number;
    errors: ConversionError[];
    warnings: ConversionWarning[];
    outputPath: string;
}
export interface ConversionError {
    pageId: string;
    pageName: string;
    error: string;
    details?: any;
}
export interface ConversionWarning {
    pageId: string;
    pageName: string;
    warning: string;
    details?: any;
}
export interface CliOptions {
    file?: string;
    workspace?: string;
    database?: string;
    config?: string;
    dryRun?: boolean;
    verbose?: boolean;
    output?: string;
    format?: string;
}
export interface FileService {
    extractOneNoteFile(filePath: string): Promise<OneNoteNotebook>;
    saveConvertedContent(content: any, outputPath: string): Promise<void>;
}
export interface ConversionService {
    convertNotebook(notebook: OneNoteNotebook, options: ConversionOptions): Promise<ConversionResult>;
    convertPage(page: OneNotePage, options: ConversionOptions): Promise<NotionPage>;
}
export interface NotionService {
    createPage(page: NotionPage, workspaceId: string, databaseId?: string): Promise<string>;
    uploadImage(image: OneNoteImage): Promise<NotionImage>;
    createDatabase(workspaceId: string, name: string): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map