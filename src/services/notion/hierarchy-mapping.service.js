"use strict";
/**
 * Hierarchy Mapping Service
 * Maps OneNote hierarchy to Notion structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyMappingService = void 0;
class HierarchyMappingService {
    async mapHierarchy(notebooks, options) {
        const startTime = Date.now();
        const pages = [];
        const errors = [];
        try {
            this.reportProgress(options, 'mapping', 10, 'Starting hierarchy mapping...');
            // Create database structure if requested
            const databases = await this.createDatabaseStructure(notebooks, options);
            if (databases.length > 0) {
                this.reportProgress(options, 'mapping', 20, 'Database structure created');
            }
            // Map each notebook with progress tracking
            const notebookPages = await this.mapNotebooks(notebooks, options);
            pages.push(...notebookPages);
            this.reportProgress(options, 'mapping', 100, 'Hierarchy mapping completed');
            // Flatten the hierarchy for the result
            const flattenedPages = this.flattenHierarchy(pages);
            return this.createSuccessResult(flattenedPages, databases, notebooks, startTime);
        }
        catch (error) {
            return this.createErrorResult(error, pages, [], startTime);
        }
    }
    async createDatabaseStructure(notebooks, options) {
        if (!options.createDatabases) {
            return [];
        }
        const databaseIds = [];
        for (const notebook of notebooks) {
            // Generate database ID (in real implementation, this would create actual databases)
            const databaseId = `db_${notebook.id}_${Date.now()}`;
            databaseIds.push(databaseId);
        }
        return databaseIds;
    }
    async mapSectionToPage(section, parentId, options) {
        const sectionPage = {
            id: section.id,
            title: section.name,
            content: `Section: ${section.name}`,
            parentId: parentId || undefined,
            properties: {
                'Type': 'Section',
                'Created Date': section.createdDate,
                'Last Modified': section.lastModifiedDate
            },
            metadata: section.metadata
        };
        // Map pages within the section with depth limit
        const pageChildren = [];
        const maxDepth = options?.maxDepth || 10;
        if (maxDepth > 1) {
            for (const page of section.pages) {
                const notionPage = await this.mapPageToNotionPage(page, section.id, { ...options, maxDepth: maxDepth - 1 });
                pageChildren.push(notionPage);
            }
        }
        sectionPage.children = pageChildren;
        return sectionPage;
    }
    async mapPageToNotionPage(page, parentId, options) {
        return {
            id: page.id,
            title: page.title,
            content: page.content,
            parentId: parentId || undefined,
            properties: {
                'Type': 'Page',
                'Created Date': page.createdDate,
                'Last Modified': page.lastModifiedDate,
                'Author': page.metadata?.author || 'Unknown',
                ...page.metadata
            },
            metadata: page.metadata
        };
    }
    validateHierarchy(pages) {
        const errors = [];
        const allPages = this.flattenHierarchy(pages);
        const pageIds = new Set(allPages.map(p => p.id));
        // Check for invalid parent references
        for (const page of allPages) {
            if (page.parentId && !pageIds.has(page.parentId)) {
                errors.push(`Page ${page.id} references non-existent parent ${page.parentId}`);
            }
        }
        // Check for circular references
        for (const page of allPages) {
            if (this.hasCircularReference(page, allPages, new Set())) {
                errors.push(`Circular reference detected involving page ${page.id}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    flattenHierarchy(pages) {
        const flattened = [];
        for (const page of pages) {
            flattened.push(page);
            if (page.children && page.children.length > 0) {
                const childPages = this.flattenHierarchy(page.children);
                flattened.push(...childPages);
            }
        }
        return flattened;
    }
    hasCircularReference(page, allPages, visited) {
        if (visited.has(page.id)) {
            return true;
        }
        if (!page.parentId) {
            return false;
        }
        visited.add(page.id);
        const parent = allPages.find(p => p.id === page.parentId);
        if (parent) {
            const hasCircular = this.hasCircularReference(parent, allPages, visited);
            if (hasCircular) {
                return true;
            }
        }
        visited.delete(page.id);
        return false;
    }
    countPages(notebooks) {
        let count = 0;
        for (const notebook of notebooks) {
            for (const section of notebook.sections) {
                count += section.pages.length;
            }
        }
        return count;
    }
    countSections(notebooks) {
        let count = 0;
        for (const notebook of notebooks) {
            count += notebook.sections.length;
        }
        return count;
    }
    async mapNotebooks(notebooks, options) {
        const pages = [];
        for (let i = 0; i < notebooks.length; i++) {
            const notebook = notebooks[i];
            this.reportProgress(options, 'mapping', 30 + (i / notebooks.length) * 60, `Mapping notebook: ${notebook.name}`, i + 1, notebooks.length);
            const notebookPage = this.createNotebookPage(notebook);
            const sectionPages = await this.mapSections(notebook.sections, notebook.id, options);
            notebookPage.children = sectionPages;
            pages.push(notebookPage);
        }
        return pages;
    }
    createNotebookPage(notebook) {
        return {
            id: notebook.id,
            title: notebook.name,
            content: `Notebook: ${notebook.name}`,
            properties: {
                'Type': 'Notebook',
                'Created Date': notebook.createdDate,
                'Last Modified': notebook.lastModifiedDate
            },
            metadata: notebook.metadata
        };
    }
    async mapSections(sections, parentId, options) {
        const sectionPages = [];
        const maxDepth = options.maxDepth || 10;
        if (maxDepth > 1) {
            for (const section of sections) {
                const sectionPage = await this.mapSectionToPage(section, parentId, { ...options, maxDepth: maxDepth - 1 });
                sectionPages.push(sectionPage);
            }
        }
        return sectionPages;
    }
    createSuccessResult(pages, databases, notebooks, startTime) {
        return {
            success: true,
            pages,
            databases: databases.length > 0 ? databases : [],
            metadata: {
                totalPages: this.countPages(notebooks),
                totalSections: this.countSections(notebooks),
                totalNotebooks: notebooks.length,
                processingTime: Date.now() - startTime
            }
        };
    }
    createErrorResult(error, pages, databases, startTime) {
        const errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
        return {
            success: false,
            pages,
            databases,
            errors,
            metadata: {
                totalPages: 0,
                totalSections: 0,
                totalNotebooks: 0,
                processingTime: Date.now() - startTime
            }
        };
    }
    reportProgress(options, stage, percentage, message, currentItem, totalItems) {
        if (options?.onProgress) {
            const progress = {
                stage,
                percentage,
                message
            };
            if (currentItem !== undefined) {
                progress.currentItem = currentItem;
            }
            if (totalItems !== undefined) {
                progress.totalItems = totalItems;
            }
            options.onProgress(progress);
        }
    }
}
exports.HierarchyMappingService = HierarchyMappingService;
//# sourceMappingURL=hierarchy-mapping.service.js.map