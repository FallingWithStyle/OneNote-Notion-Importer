"use strict";
/**
 * Main OneNote service
 * Orchestrates extraction, parsing, and display of OneNote files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneNoteService = void 0;
const extraction_service_1 = require("./extraction.service");
const parser_service_1 = require("./parser.service");
const display_service_1 = require("./display.service");
const error_handler_service_1 = require("./error-handler.service");
const error_utils_1 = require("./error-utils");
class OneNoteService {
    constructor(extractionService, parserService, displayService, errorHandlerService) {
        this.extractionService = extractionService || new extraction_service_1.OneNoteExtractionService();
        this.parserService = parserService || new parser_service_1.OneNoteParserService();
        this.displayService = displayService || new display_service_1.OneNoteDisplayService();
        this.errorHandlerService = errorHandlerService || new error_handler_service_1.OneNoteErrorHandlerService();
    }
    async processFiles(filePaths, options) {
        try {
            // Use extraction service to process files
            return await this.extractionService.extractMultiple(filePaths, options);
        }
        catch (error) {
            // Handle extraction errors with fallback
            if (error instanceof error_utils_1.OneNoteError) {
                if (error.recoverable) {
                    const result = await this.errorHandlerService.handleExtractionError(error, filePaths[0] || '');
                    return result;
                }
                else {
                    return error_utils_1.OneNoteErrorUtils.createErrorResponse(error, { filePath: filePaths[0] || '', operation: 'processFiles' });
                }
            }
            else if (error instanceof Error) {
                if (this.errorHandlerService.isRecoverableError(error)) {
                    const result = await this.errorHandlerService.handleExtractionError(error, filePaths[0] || '');
                    return result;
                }
                else {
                    // For non-recoverable errors, try parsing error handler first, then extraction error handler
                    if (error.message.includes('Parsing failed') || error.message.includes('parse')) {
                        const result = await this.errorHandlerService.handleParsingError(error, filePaths[0] || '');
                        return result;
                    }
                    else {
                        const result = await this.errorHandlerService.handleExtractionError(error, filePaths[0] || '');
                        return result;
                    }
                }
            }
            // Handle unknown errors
            return error_utils_1.OneNoteErrorUtils.createErrorResponse(new Error('Unknown error occurred'), { operation: 'processFiles' });
        }
    }
    displayHierarchy(hierarchy, options) {
        this.displayService.displayHierarchy(hierarchy, options);
    }
    async validateFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const fileInfo = await this.extractionService.validateOneNoteFile(filePath);
                results.push(fileInfo.isValid);
            }
            catch (error) {
                results.push(false);
            }
        }
        return results;
    }
}
exports.OneNoteService = OneNoteService;
//# sourceMappingURL=onenote.service.js.map