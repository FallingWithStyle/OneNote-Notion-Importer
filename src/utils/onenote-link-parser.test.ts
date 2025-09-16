/**
 * Tests for OneNote Link Parser
 */

import { OneNoteLinkParser, ParsedOneNoteLink } from './onenote-link-parser';

describe('OneNoteLinkParser', () => {
  describe('parseLink', () => {
    it('should parse OneDrive URLs correctly', () => {
      const oneDriveUrl = 'https://onedrive.live.com/view.aspx?resid=4E9CB9390373063C%211126&id=documents&wd=target%28Zequin%20Isles%20Campaign%20%28Lycanthropes%5C%29.one%7CE306FB3E-F4BF-3749-BB49-B1121D326A3A%2F%29&wdsectionfileid=4E9CB9390373063C!2403';
      
      const result = OneNoteLinkParser.parseLink(oneDriveUrl);
      
      expect(result.type).toBe('onedrive');
      expect(result.fileName).toBe('Zequin Isles Campaign (Lycanthropes)');
      expect(result.sectionId).toBe('E306FB3E-F4BF-3749-BB49-B1121D326A3A');
      expect(result.isValid).toBe(true);
      expect(result.originalUrl).toBe(oneDriveUrl);
    });

    it('should parse onenote: protocol URLs correctly', () => {
      const onenoteUrl = 'onenote:https://d.docs.live.net/4E9CB9390373063C/Documents/DnD%20(pre%20merge)/Zequin%20Isles%20Campaign%20(Lycanthropes).one#section-id={E306FB3E-F4BF-3749-BB49-B1121D326A3A}&end';
      
      const result = OneNoteLinkParser.parseLink(onenoteUrl);
      
      expect(result.type).toBe('onenote');
      expect(result.fileName).toBe('Zequin Isles Campaign (Lycanthropes)');
      expect(result.sectionId).toBe('E306FB3E-F4BF-3749-BB49-B1121D326A3A');
      expect(result.isValid).toBe(true);
      expect(result.originalUrl).toBe(onenoteUrl);
    });

    it('should parse local file paths correctly', () => {
      const filePath = '/path/to/notebook.one';
      
      const result = OneNoteLinkParser.parseLink(filePath);
      
      expect(result.type).toBe('filepath');
      expect(result.fileName).toBe('notebook');
      expect(result.filePath).toBe(filePath);
      expect(result.isValid).toBe(true);
      expect(result.originalUrl).toBe(filePath);
    });

    it('should handle Windows file paths', () => {
      const filePath = 'C:\\Users\\User\\Documents\\notebook.one';
      
      const result = OneNoteLinkParser.parseLink(filePath);
      
      expect(result.type).toBe('filepath');
      expect(result.fileName).toBe('notebook');
      expect(result.filePath).toBe(filePath);
      expect(result.isValid).toBe(true);
    });

    it('should handle .onepkg files', () => {
      const filePath = '/path/to/notebook.onepkg';
      
      const result = OneNoteLinkParser.parseLink(filePath);
      
      expect(result.type).toBe('filepath');
      expect(result.fileName).toBe('notebook');
      expect(result.filePath).toBe(filePath);
      expect(result.isValid).toBe(true);
    });

    it('should handle invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url';
      
      const result = OneNoteLinkParser.parseLink(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid OneNote link format');
    });

    it('should handle malformed OneDrive URLs', () => {
      const malformedUrl = 'https://onedrive.live.com/view.aspx?invalid=param';
      
      const result = OneNoteLinkParser.parseLink(malformedUrl);
      
      expect(result.type).toBe('onedrive');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing resid parameter');
    });

    it('should handle malformed onenote: URLs', () => {
      const malformedUrl = 'onenote:invalid-url';
      
      const result = OneNoteLinkParser.parseLink(malformedUrl);
      
      expect(result.type).toBe('onenote');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to parse onenote: URL');
    });
  });

  describe('getDisplayName', () => {
    it('should return filename when available', () => {
      const parsedLink: ParsedOneNoteLink = {
        type: 'filepath',
        fileName: 'My Notebook',
        filePath: '/path/to/notebook.one',
        originalUrl: '/path/to/notebook.one',
        isValid: true
      };
      
      expect(OneNoteLinkParser.getDisplayName(parsedLink)).toBe('My Notebook');
    });

    it('should return type-based name when filename is not available', () => {
      const parsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: '',
        originalUrl: 'https://onedrive.live.com/...',
        isValid: true
      };
      
      expect(OneNoteLinkParser.getDisplayName(parsedLink)).toBe('OneDrive OneNote File');
    });
  });

  describe('canProcessLink', () => {
    it('should return true for valid file paths', () => {
      const parsedLink: ParsedOneNoteLink = {
        type: 'filepath',
        fileName: 'notebook',
        filePath: '/path/to/notebook.one',
        originalUrl: '/path/to/notebook.one',
        isValid: true
      };
      
      expect(OneNoteLinkParser.canProcessLink(parsedLink)).toBe(true);
    });

    it('should return false for invalid links', () => {
      const parsedLink: ParsedOneNoteLink = {
        type: 'filepath',
        fileName: '',
        originalUrl: 'invalid',
        isValid: false,
        error: 'Invalid format'
      };
      
      expect(OneNoteLinkParser.canProcessLink(parsedLink)).toBe(false);
    });

    it('should return false for OneDrive links (not yet supported)', () => {
      const parsedLink: ParsedOneNoteLink = {
        type: 'onedrive',
        fileName: 'notebook',
        originalUrl: 'https://onedrive.live.com/...',
        isValid: true
      };
      
      expect(OneNoteLinkParser.canProcessLink(parsedLink)).toBe(false);
    });
  });
});
