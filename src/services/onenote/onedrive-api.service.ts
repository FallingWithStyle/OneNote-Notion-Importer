/**
 * OneDrive API Service
 * 
 * Handles OneDrive API integration for downloading OneNote files
 */

import { ParsedOneNoteLink } from '../../utils/onenote-link-parser';

export interface OneDriveDownloadResult {
  success: boolean;
  fileName?: string;
  content?: ArrayBuffer;
  size?: number;
  error?: string;
}

export interface OneDriveMetadataResult {
  success: boolean;
  metadata?: {
    id: string;
    name: string;
    size: number;
    lastModifiedDateTime: string;
  };
  error?: string;
}

export class OneDriveApiService {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Download OneNote file from OneDrive
   */
  async downloadOneNoteFile(parsedLink: ParsedOneNoteLink): Promise<OneDriveDownloadResult> {
    // Validate the parsed link
    if (!parsedLink.isValid) {
      return {
        success: false,
        error: `Invalid OneNote link: ${parsedLink.error || 'Unknown error'}`
      };
    }

    if (parsedLink.type !== 'onedrive') {
      return {
        success: false,
        error: 'Link is not a OneDrive URL'
      };
    }

    try {
      // Extract file ID from the original URL
      const fileId = this.extractFileIdFromUrl(parsedLink.originalUrl);
      if (!fileId) {
        return {
          success: false,
          error: 'Could not extract file ID from OneDrive URL'
        };
      }

      // Download the file content
      const response = await fetch(
        `${this.baseUrl}/me/drive/items/${fileId}/content`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/octet-stream'
          }
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to download file: ${response.status} ${response.statusText}`
        };
      }

      const content = await response.arrayBuffer();
      const fileName = `${parsedLink.fileName}.one`;

      return {
        success: true,
        fileName,
        content,
        size: content.byteLength
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<OneDriveMetadataResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/drive/items/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to retrieve file metadata: ${response.status} ${response.statusText}`
        };
      }

      const metadata = await response.json();
      return {
        success: true,
        metadata: {
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          lastModifiedDateTime: metadata.lastModifiedDateTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Extract file ID from OneDrive URL
   */
  private extractFileIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      return params.get('resid');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get download URL for a file (for direct browser download)
   */
  async getDownloadUrl(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/drive/items/${fileId}/content`,
        {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      return `${this.baseUrl}/me/drive/items/${fileId}/content`;
    } catch (error) {
      return null;
    }
  }
}
