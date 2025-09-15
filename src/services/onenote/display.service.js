"use strict";
/**
 * OneNote hierarchy display service
 * Handles CLI display of notebook structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneNoteDisplayService = void 0;
class OneNoteDisplayService {
    displayHierarchy(hierarchy, options) {
        const opts = {
            showMetadata: false,
            showContent: false,
            maxDepth: 3,
            includeEmptySections: true,
            sortBy: 'name',
            outputFormat: 'tree',
            ...options
        };
        if (hierarchy.notebooks.length === 0) {
            console.log('No notebooks found');
            return;
        }
        console.log('OneNote Hierarchy:');
        hierarchy.notebooks.forEach((notebook, index) => {
            this.displayNotebook(notebook, { ...opts, maxDepth: opts.maxDepth - 1 });
        });
    }
    displayNotebook(notebook, options) {
        const opts = {
            showMetadata: false,
            showContent: false,
            maxDepth: 3,
            includeEmptySections: true,
            sortBy: 'name',
            outputFormat: 'tree',
            ...options
        };
        console.log(`📓 ${notebook.name}`);
        if (notebook.sections.length === 0) {
            console.log('  No sections found');
            return;
        }
        if (opts.maxDepth > 0) {
            notebook.sections.forEach(section => {
                this.displaySection(section, { ...opts, maxDepth: opts.maxDepth - 1 });
            });
        }
    }
    displaySection(section, options) {
        const opts = {
            showMetadata: false,
            showContent: false,
            maxDepth: 3,
            includeEmptySections: true,
            sortBy: 'name',
            outputFormat: 'tree',
            ...options
        };
        console.log(`  📁 ${section.name}`);
        if (section.pages.length === 0) {
            console.log('    No pages found');
            return;
        }
        if (opts.maxDepth > 0) {
            section.pages.forEach(page => {
                console.log(`    📄 ${page.title}`);
                if (opts.showContent && page.content) {
                    console.log(`      ${page.content.substring(0, 100)}...`);
                }
            });
        }
    }
    displaySummary(hierarchy) {
        console.log('Summary:');
        console.log(`${hierarchy.totalNotebooks} notebook${hierarchy.totalNotebooks !== 1 ? 's' : ''}`);
        console.log(`${hierarchy.totalSections} section${hierarchy.totalSections !== 1 ? 's' : ''}`);
        console.log(`${hierarchy.totalPages} page${hierarchy.totalPages !== 1 ? 's' : ''}`);
    }
}
exports.OneNoteDisplayService = OneNoteDisplayService;
//# sourceMappingURL=display.service.js.map