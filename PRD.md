# OneNote to Notion Importer (ONI) - Product Requirements Document

## Project Metadata
- **Project Name**: OneNote to Notion Importer (ONI)
- **Project ID**: ONI-001
- **Version**: 1.0.0
- **Last Updated**: 2025-09-14
- **Status**: Draft

## 1. Executive Summary
- **Problem Statement**: Users need a reliable way to migrate their OneNote content to Notion while maintaining control over what gets imported and preserving the hierarchical structure of their notebooks.
- **Solution Overview**: A local, offline-first CLI tool that converts OneNote files (.onepkg/.one) to Notion-compatible formats and imports them via the Notion API, with optional GUI wrapper.
- **Key Benefits**: 
  - Complete offline operation (no third-party servers)
  - Granular control over import selection
  - Preservation of notebook hierarchy
  - Cross-platform compatibility
  - Extensible architecture for future enhancements
- **Success Metrics**: 
  - Successfully imports 95%+ of OneNote content without data loss
  - Maintains notebook → section → page hierarchy in Notion
  - Processes files 10x faster than manual migration
  - Zero data sent to external servers

## 2. Goals and Background Context
- **Primary Goals**: 
  - Build a reliable OneNote to Notion migration tool
  - Provide granular control over import selection
  - Ensure complete offline operation
  - Preserve content hierarchy and metadata
  - Create extensible architecture for future enhancements
- **Background Context**: Many users want to migrate from OneNote to Notion but lack reliable tools that preserve their content structure and give them control over the migration process.
- **Stakeholders**: OneNote users seeking to migrate to Notion, Notion power users
- **Timeline**: 8-12 weeks for MVP, 16-20 weeks for full feature set

## 3. Requirements
### 3.1 Functional Requirements
- **FR1**: Accept OneNote input files (.onepkg notebook packages and individual .one section files)
- **FR2**: Extract and convert OneNote content to Notion-compatible formats (markdown, HTML, or DOCX)
- **FR3**: Support two output modes: local export (markdown/HTML + media folders) and direct Notion import via API
- **FR4**: Preserve notebook → section → page hierarchy as Notion nested pages
- **FR5**: Upload embedded images and attachments to Notion
- **FR6**: Provide CLI interface with options to select specific notebooks/sections/pages for import
- **FR7**: Support configuration file (.onirc) for storing defaults (API keys, paths, etc.)
- **FR8**: Display import progress and provide detailed error logging
- **FR9**: Support dry-run mode to preview imports without executing them

### 3.2 Non-Functional Requirements
- **NFR1**: Must run completely offline with no third-party server dependencies
- **NFR2**: Cross-platform compatibility (macOS primary, Windows/Linux secondary)
- **NFR3**: Process files 10x faster than manual migration
- **NFR4**: Maintain 95%+ data integrity during conversion
- **NFR5**: Graceful error handling with retry support for API failures
- **NFR6**: Modular architecture allowing separate conversion and import modules
- **NFR7**: Support for parallel uploads to improve performance

## 4. User Experience
- **Target Users**: 
  - OneNote power users with extensive notebook collections
  - Users migrating from OneNote to Notion for better collaboration
  - Content creators who need to preserve their knowledge base structure
- **User Stories**: 
  - As a OneNote user, I want to migrate my notebooks to Notion while preserving their structure
  - As a user, I want to choose which specific notebooks/sections/pages to import
  - As a user, I want to preview what will be imported before executing the migration
  - As a user, I want the tool to work offline without sending my data to external servers
- **User Interface Requirements**: 
  - CLI-first interface with clear command options
  - Optional GUI wrapper using Electron + React
  - Tree view for notebook/section/page selection
  - Progress indicators and error reporting
  - Configuration file support for repeated use

## 5. Technical Specifications
- **Technology Stack**: 
  - Node.js/TypeScript for core logic
  - Commander.js or OCLIF for CLI interface
  - Electron + React for optional GUI
  - Notion SDK for JavaScript for API integration
  - Winston for logging
  - Jest for testing framework
  - TDD (Test-Driven Development) methodology
- **Architecture**: 
  - Modular design with separate converter/, notion/, cli/, and gui/ modules
  - Plugin architecture for different conversion methods
  - Configuration management system
  - Test-first development approach with comprehensive test coverage
- **Integration Points**: 
  - Notion API for content import
  - Local file system for OneNote file processing
  - External conversion tools (ConvertOneNote2MarkDown, Word export)
- **Deployment**: 
  - Local installation via npm/yarn
  - Cross-platform binaries for distribution
  - No server infrastructure required

## 6. Epics and Stories
### Epic 1: Core CLI Infrastructure
**Goal**: Build the foundational CLI tool with basic file processing capabilities

#### Story 1.1: Project Setup and CLI Framework
- **User Story**: As a developer, I want a working CLI tool structure, so that I can build the core functionality
- **Acceptance Criteria**:
  - AC1: CLI tool accepts .onepkg and .one file inputs
  - AC2: Basic command structure with help and version commands
  - AC3: Configuration file support (.onirc)
  - AC4: Logging system with different levels (debug, info, warn, error)
- **Technical Notes**: Use Commander.js or OCLIF, implement TypeScript configuration, set up Winston logging
- **Dependencies**: None

#### Story 1.2: OneNote File Extraction
- **User Story**: As a user, I want to extract content from OneNote files, so that I can process them for import
- **Acceptance Criteria**:
  - AC1: Extract .onepkg archives to individual .one files
  - AC2: Parse .one files to identify notebooks, sections, and pages
  - AC3: Display hierarchical structure in CLI output
  - AC4: Handle extraction errors gracefully
- **Technical Notes**: Research OneNote file format, implement extraction logic, create fallback for complex parsing
- **Dependencies**: Story 1.1

### Epic 2: Content Conversion
**Goal**: Convert OneNote content to Notion-compatible formats

#### Story 2.1: Basic Content Conversion
- **User Story**: As a user, I want OneNote content converted to markdown, so that it can be imported to Notion
- **Acceptance Criteria**:
  - AC1: Convert text content to markdown format
  - AC2: Extract and preserve images in separate media folder
  - AC3: Handle basic formatting (bold, italic, lists, headers)
  - AC4: Support both .md and .docx output formats
- **Technical Notes**: Implement conversion module, research OneNote content structure, create media handling
- **Dependencies**: Story 1.2

#### Story 2.2: Advanced Content Conversion
- **User Story**: As a user, I want complex OneNote content preserved, so that my knowledge base structure is maintained
- **Acceptance Criteria**:
  - AC1: Preserve tables and complex layouts
  - AC2: Handle embedded files and attachments
  - AC3: Convert OneNote tags to Notion properties
  - AC4: Maintain page metadata (creation date, last modified)
- **Technical Notes**: Extend conversion module, implement metadata mapping, handle complex content types
- **Dependencies**: Story 2.1

### Epic 3: Notion Integration
**Goal**: Import converted content into Notion via API

#### Story 3.1: Notion API Integration
- **User Story**: As a user, I want to import content directly to Notion, so that I don't have to manually upload files
- **Acceptance Criteria**:
  - AC1: Authenticate with Notion API using integration token
  - AC2: Create pages in specified Notion workspace/database
  - AC3: Upload images and attachments to Notion
  - AC4: Handle API rate limits and errors gracefully
- **Technical Notes**: Implement Notion SDK integration, create API wrapper module, implement retry logic
- **Dependencies**: Story 2.1

#### Story 3.2: Hierarchy Preservation
- **User Story**: As a user, I want my notebook structure preserved in Notion, so that my content organization is maintained
- **Acceptance Criteria**:
  - AC1: Create nested pages representing notebook → section → page hierarchy
  - AC2: Set appropriate page properties and metadata
  - AC3: Handle large imports with progress tracking
  - AC4: Support parallel uploads for performance
- **Technical Notes**: Implement hierarchy mapping, create progress tracking, optimize for large imports
- **Dependencies**: Story 3.1

### Epic 4: User Experience Enhancement
**Goal**: Improve usability and provide advanced features

#### Story 4.1: Selection and Preview Features
- **User Story**: As a user, I want to choose what to import and preview the results, so that I have control over the migration
- **Acceptance Criteria**:
  - AC1: Interactive selection of notebooks/sections/pages
  - AC2: Dry-run mode showing what will be imported
  - AC3: Preview of converted content before import
  - AC4: Detailed logging and error reporting
- **Technical Notes**: Implement selection interface, create preview functionality, enhance logging
- **Dependencies**: Story 3.1

#### Story 4.2: GUI Wrapper (Optional)
- **User Story**: As a user, I want a graphical interface, so that the tool is easier to use
- **Acceptance Criteria**:
  - AC1: Electron-based GUI with React frontend
  - AC2: Tree view for notebook/section/page selection
  - AC3: Progress indicators and status updates
  - AC4: Configuration management through GUI
- **Technical Notes**: Create Electron app, implement React components, integrate with CLI core
- **Dependencies**: Story 4.1

## 7. Constraints and Assumptions
- **Technical Constraints**: 
  - OneNote file format complexity may require external conversion tools
  - Notion API rate limits may slow large imports
  - Cross-platform compatibility challenges with OneNote file parsing
- **Business Constraints**: 
  - Must be completely free and open-source
  - No budget for external services or APIs beyond Notion
  - Timeline pressure for MVP delivery
- **Assumptions**: 
  - Users have valid Notion API integration tokens
  - OneNote files are accessible and not corrupted
  - Users are comfortable with CLI tools
- **Risks**: 
  - OneNote file format changes breaking compatibility (mitigation: modular conversion system)
  - Notion API changes affecting import functionality (mitigation: version pinning and testing)
  - Complex OneNote content not converting properly (mitigation: fallback to basic text extraction)

## 8. Success Criteria
- **Minimum Viable Product (MVP)**: 
  - CLI tool that accepts .onepkg/.one files
  - Basic content conversion to markdown
  - Direct import to Notion with preserved hierarchy
  - Configuration file support
- **Success Metrics**: 
  - 95%+ successful conversion rate for basic content
  - 10x faster than manual migration
  - Zero data loss during conversion
  - User satisfaction score > 4.0/5.0
- **Quality Gates**: 
  - All unit tests passing (TDD Red-Green-Refactor cycle)
  - Integration tests with sample OneNote files
  - Performance benchmarks met
  - Security audit completed
  - Test coverage > 90% for core modules

## 9. Timeline and Milestones
- **Phase 1 (Weeks 1-4)**: Core CLI infrastructure and basic file extraction
- **Phase 2 (Weeks 5-8)**: Content conversion and Notion API integration
- **Phase 3 (Weeks 9-12)**: User experience features and testing
- **Final Release (Week 12)**: MVP with optional GUI wrapper

## 10. Appendices
- **Glossary**: 
  - .onepkg: OneNote notebook package file containing multiple sections
  - .one: OneNote section file containing pages and content
  - Notion Integration: API-based connection to Notion workspace
  - Dry-run: Preview mode that shows what will be imported without executing
- **References**: 
  - Notion API Documentation
  - OneNote File Format Specification
  - ConvertOneNote2MarkDown project
  - Commander.js CLI framework documentation
- **Change Log**: 
  - 2025-09-14: Updated project name to OneNote to Notion Importer (ONI) with project ID ONI-001
  - 2024-12-19: Initial PRD creation for OneNote to Notion Importer project
