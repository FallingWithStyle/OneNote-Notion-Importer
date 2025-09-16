/**
 * OneNote Link Parser Utility
 * 
 * Parses OneNote links from various formats:
 * - OneDrive web URLs
 * - onenote: protocol URLs
 * - Direct file paths
 */

export interface ParsedOneNoteLink {
  type: 'onedrive' | 'onenote' | 'filepath';
  fileName: string;
  filePath?: string;
  sectionId?: string;
  originalUrl: string;
  isValid: boolean;
  error?: string;
}

export interface OneDriveLinkData {
  resid: string;
  fileName: string;
  sectionId?: string;
}

export interface OneNoteProtocolData {
  fileName: string;
  filePath: string;
  sectionId?: string;
}

export class OneNoteLinkParser {
  /**
   * Parse a OneNote link from various formats
   */
  static parseLink(input: string): ParsedOneNoteLink {
    const trimmedInput = input.trim();
    
    // Check if it's a file path (local file)
    if (this.isLocalFilePath(trimmedInput)) {
      return {
        type: 'filepath',
        fileName: this.extractFileName(trimmedInput),
        filePath: trimmedInput,
        originalUrl: trimmedInput,
        isValid: true
      };
    }
    
    // Check if it's a OneDrive URL
    if (trimmedInput.includes('onedrive.live.com')) {
      return this.parseOneDriveUrl(trimmedInput);
    }
    
    // Check if it's an onenote: protocol URL
    if (trimmedInput.startsWith('onenote:')) {
      return this.parseOneNoteProtocol(trimmedInput);
    }
    
    // If none of the above, treat as invalid
    return {
      type: 'filepath',
      fileName: '',
      originalUrl: trimmedInput,
      isValid: false,
      error: 'Invalid OneNote link format'
    };
  }

  /**
   * Parse OneDrive web URL
   */
  private static parseOneDriveUrl(url: string): ParsedOneNoteLink {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Extract resid parameter
      const resid = params.get('resid');
      if (!resid) {
        return {
          type: 'onedrive',
          fileName: '',
          originalUrl: url,
          isValid: false,
          error: 'Missing resid parameter in OneDrive URL'
        };
      }
      
      // Extract filename from wd parameter
      const wd = params.get('wd');
      let fileName = '';
      let sectionId = '';
      
      if (wd) {
        // Parse the wd parameter to extract filename and section ID
        // Look for the pattern: target(filename.one|sectionId/)
        // Use a simpler approach: find the content between target( and the last )
        const targetStart = wd.indexOf('target(');
        if (targetStart !== -1) {
          const targetContent = wd.substring(targetStart + 7); // Skip "target("
          const lastParen = targetContent.lastIndexOf(')');
          if (lastParen !== -1) {
            const content = targetContent.substring(0, lastParen);
            
            // Split by pipe to get filename and section ID parts
            const parts = content.split('|');
            if (parts.length >= 2) {
              // First part is the filename
              const fileNamePart = parts[0];
              if (fileNamePart) {
                fileName = decodeURIComponent(fileNamePart);
                // Remove .one extension if present and clean up any escaped characters
                fileName = fileName.replace(/\.one$/, '').replace(/\\/g, '');
              }
              
              // Second part is the section ID (remove trailing slash)
              const sectionIdPart = parts[1];
              if (sectionIdPart) {
                sectionId = sectionIdPart.replace(/\/$/, '');
              }
            }
          }
        }
      }
      
      if (!fileName) {
        return {
          type: 'onedrive',
          fileName: '',
          originalUrl: url,
          isValid: false,
          error: 'Could not extract filename from OneDrive URL'
        };
      }
      
      return {
        type: 'onedrive',
        fileName,
        sectionId,
        originalUrl: url,
        isValid: true
      };
    } catch (error) {
      return {
        type: 'onedrive',
        fileName: '',
        originalUrl: url,
        isValid: false,
        error: `Failed to parse OneDrive URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Parse onenote: protocol URL
   */
  private static parseOneNoteProtocol(url: string): ParsedOneNoteLink {
    try {
      // Remove onenote: prefix
      const urlWithoutProtocol = url.replace(/^onenote:/, '');
      const urlObj = new URL(urlWithoutProtocol);
      
      // Extract filename from pathname
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (!fileName || !fileName.endsWith('.one')) {
        return {
          type: 'onenote',
          fileName: '',
          originalUrl: url,
          isValid: false,
          error: 'Invalid onenote: URL - missing or invalid filename'
        };
      }
      
      // Decode the filename
      const decodedFileName = decodeURIComponent(fileName);
      
      // Extract section ID from hash
      let sectionId = '';
      if (urlObj.hash) {
        const sectionMatch = urlObj.hash.match(/section-id=\{([^}]+)\}/);
        if (sectionMatch && sectionMatch[1]) {
          sectionId = sectionMatch[1];
        }
      }
      
      return {
        type: 'onenote',
        fileName: decodedFileName.replace(/\.one$/, ''),
        filePath: urlWithoutProtocol,
        sectionId,
        originalUrl: url,
        isValid: true
      };
    } catch (error) {
      return {
        type: 'onenote',
        fileName: '',
        originalUrl: url,
        isValid: false,
        error: `Failed to parse onenote: URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if input is a local file path
   */
  private static isLocalFilePath(input: string): boolean {
    // Check for common file path patterns
    return (
      input.startsWith('/') || // Unix absolute path
      input.startsWith('C:\\') || // Windows absolute path
      input.startsWith('./') || // Relative path
      input.startsWith('../') || // Relative path
      input.includes('\\') || // Windows path separator
      (input.includes('.') && (input.endsWith('.one') || input.endsWith('.onepkg'))) // File with extension
    );
  }

  /**
   * Extract filename from file path
   */
  private static extractFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    return fileName ? fileName.replace(/\.(one|onepkg)$/, '') : '';
  }

  /**
   * Convert OneDrive link to downloadable file path (if possible)
   */
  static convertOneDriveToFilePath(parsedLink: ParsedOneNoteLink): string | null {
    if (parsedLink.type !== 'onedrive' || !parsedLink.isValid) {
      return null;
    }
    
    // For OneDrive links, we can't directly convert to a local file path
    // This would require OneDrive API integration
    // For now, return null to indicate it needs special handling
    return null;
  }

  /**
   * Get display name for the parsed link
   */
  static getDisplayName(parsedLink: ParsedOneNoteLink): string {
    if (parsedLink.fileName) {
      return parsedLink.fileName;
    }
    
    switch (parsedLink.type) {
      case 'onedrive':
        return 'OneDrive OneNote File';
      case 'onenote':
        return 'OneNote Protocol File';
      case 'filepath':
        return 'Local OneNote File';
      default:
        return 'Unknown OneNote Link';
    }
  }

  /**
   * Validate if a parsed link can be processed
   */
  static canProcessLink(parsedLink: ParsedOneNoteLink): boolean {
    if (!parsedLink.isValid) {
      return false;
    }
    
    // Local file paths can always be processed
    if (parsedLink.type === 'filepath') {
      return true;
    }
    
    // OneDrive and onenote: links need special handling
    // For now, we'll indicate they need special processing
    return false;
  }
}
