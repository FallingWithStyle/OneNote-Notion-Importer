/**
 * Tests for Link Validation Service
 */

import { LinkValidationService } from './link-validation.service';
import { OneNoteLinkParser, ParsedOneNoteLink } from '../../utils/onenote-link-parser';

describe('LinkValidationService', () => {
  let service: LinkValidationService;

  beforeEach(() => {
    service = new LinkValidationService();
  });

  describe('validateLink', () => {
    it('should validate OneDrive links correctly', () => {
      const validOneDriveUrl = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29';
      const parsedLink = OneNoteLinkParser.parseLink(validOneDriveUrl);
      
      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate local file paths correctly', () => {
      const localPath = '/path/to/notebook.one';
      const parsedLink = OneNoteLinkParser.parseLink(localPath);
      
      // Mock file system check
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      const originalStatSync = fs.statSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.statSync = jest.fn().mockReturnValue({ size: 1024 });

      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      // Restore original functions
      fs.existsSync = originalExistsSync;
      fs.statSync = originalStatSync;
    });

    it('should validate onenote: protocol URLs correctly', () => {
      const onenoteUrl = 'onenote:https://d.docs.live.net/123/Documents/notebook.one#section-id={section-id}&end';
      const parsedLink = OneNoteLinkParser.parseLink(onenoteUrl);
      
      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid OneDrive URLs', () => {
      const invalidOneDriveUrl = 'https://onedrive.live.com/view.aspx?resid=123&id=documents';
      const parsedLink = OneNoteLinkParser.parseLink(invalidOneDriveUrl);
      
      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Could not extract filename from OneDrive URL');
    });

    it('should detect invalid local file paths', () => {
      const invalidPath = '/path/to/nonexistent.one';
      const parsedLink = OneNoteLinkParser.parseLink(invalidPath);
      
      // Mock file system check
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File does not exist');

      // Restore original function
      fs.existsSync = originalExistsSync;
    });

    it('should detect completely invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url';
      const parsedLink = OneNoteLinkParser.parseLink(invalidUrl);
      
      const result = service.validateLink(parsedLink);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid OneNote link format');
    });

    it('should provide warnings for potentially problematic links', () => {
      const longUrl = 'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29&extra=' + 'a'.repeat(3000);
      const parsedLink = OneNoteLinkParser.parseLink(longUrl);
      
      const result = service.validateLink(parsedLink);

      expect(result.warnings).toContain('URL is unusually long');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple links and provide summary', () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29',
        '/path/to/notebook.one',
        'invalid-url'
      ];

      // Mock file system check
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      const originalStatSync = fs.statSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.statSync = jest.fn().mockReturnValue({ size: 1024 });

      const result = service.validateBatch(links);

      expect(result.totalLinks).toBe(3);
      expect(result.validLinks).toBe(2);
      expect(result.invalidLinks).toBe(1);
      expect(result.errors).toHaveLength(1);

      // Restore original functions
      fs.existsSync = originalExistsSync;
      fs.statSync = originalStatSync;
    });
  });

  describe('suggestCorrections', () => {
    it('should suggest corrections for common URL issues', () => {
      const invalidUrl = 'https://onedrive.live.com/view.aspx?resid=123';
      const parsedLink = OneNoteLinkParser.parseLink(invalidUrl);
      
      const suggestions = service.suggestCorrections(parsedLink);

      expect(suggestions).toContain('Add wd parameter with filename');
      expect(suggestions).toContain('Ensure URL includes target(filename.one|sectionId/)');
    });

    it('should suggest corrections for local file paths', () => {
      const invalidPath = 'not-a-path';
      const parsedLink = OneNoteLinkParser.parseLink(invalidPath);
      
      const suggestions = service.suggestCorrections(parsedLink);

      expect(suggestions).toContain('Add .one or .onepkg extension');
    });

    it('should suggest corrections for onenote: protocol URLs', () => {
      const invalidProtocol = 'onenote:invalid-url';
      const parsedLink = OneNoteLinkParser.parseLink(invalidProtocol);
      
      const suggestions = service.suggestCorrections(parsedLink);

      expect(suggestions).toContain('Ensure URL follows onenote:https://d.docs.live.net/... format');
    });
  });

  describe('recoverFromError', () => {
    it('should attempt to recover from common parsing errors', () => {
      const malformedUrl = 'https://onedrive.live.com/view.aspx?resid=123&id=documents';
      const parsedLink = OneNoteLinkParser.parseLink(malformedUrl);
      
      const recovery = service.recoverFromError(parsedLink);

      expect(recovery.attempted).toBe(true);
      expect(recovery.success).toBeDefined();
    });

    it('should handle recovery failures gracefully', () => {
      const completelyInvalid = 'not-a-url-at-all';
      const parsedLink = OneNoteLinkParser.parseLink(completelyInvalid);
      
      const recovery = service.recoverFromError(parsedLink);

      expect(recovery.attempted).toBe(true);
      expect(recovery.success).toBe(false);
      expect(recovery.error).toBeDefined();
    });
  });

  describe('getValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const links = [
        'https://onedrive.live.com/view.aspx?resid=123&id=documents&wd=target%28notebook.one%7Csection-id%2F%29',
        '/path/to/notebook.one',
        'invalid-url'
      ];

      const report = service.getValidationReport(links);

      expect(report.summary).toBeDefined();
      expect(report.details).toHaveLength(3);
      expect(report.recommendations).toBeDefined();
    });
  });
});
