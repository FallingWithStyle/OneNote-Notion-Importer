/**
 * Microsoft Graph Authentication Service
 * Handles OAuth2 authentication with Microsoft Graph API
 */

import { ConfigService } from '../config.service';
import { logger } from '../../utils/logger';

export interface MicrosoftAuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class MicrosoftAuthService {
  private configService: ConfigService;
  private authConfig: MicrosoftAuthConfig | null = null;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.loadAuthConfig();
  }

  private loadAuthConfig(): void {
    try {
      const config = this.configService.getConfig();
      if (config.microsoft) {
        this.authConfig = {
          clientId: config.microsoft.clientId || '',
          tenantId: config.microsoft.tenantId || 'common',
          redirectUri: config.microsoft.redirectUri || 'http://localhost:3000/auth/callback',
          scopes: config.microsoft.scopes || ['Files.Read', 'User.Read']
        };
      }
    } catch (error) {
      logger.error('Failed to load Microsoft auth config:', error);
    }
  }

  /**
   * Get the authorization URL for OAuth2 flow
   */
  getAuthorizationUrl(): string | null {
    if (!this.authConfig?.clientId) {
      logger.error('Microsoft client ID not configured');
      return null;
    }

    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      response_type: 'code',
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(' '),
      response_mode: 'query',
      state: this.generateState()
    });

    return `https://login.microsoftonline.com/${this.authConfig.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<AuthTokens | null> {
    if (!this.authConfig?.clientId) {
      logger.error('Microsoft client ID not configured');
      return null;
    }

    try {
      const response = await fetch(`https://login.microsoftonline.com/${this.authConfig.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.authConfig.clientId,
          code: code,
          redirect_uri: this.authConfig.redirectUri,
          grant_type: 'authorization_code',
          scope: this.authConfig.scopes.join(' ')
        })
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Token exchange failed:', error);
        return null;
      }

      const tokenData = await response.json();
      const tokens: AuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };

      // Save tokens to config
      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      logger.error('Failed to exchange code for token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<AuthTokens | null> {
    const config = this.configService.getConfig();
    const refreshToken = config.microsoft?.refreshToken;

    if (!refreshToken || !this.authConfig?.clientId) {
      logger.error('Refresh token or client ID not available');
      return null;
    }

    try {
      const response = await fetch(`https://login.microsoftonline.com/${this.authConfig.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.authConfig.clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: this.authConfig.scopes.join(' ')
        })
      });

      if (!response.ok) {
        logger.error('Token refresh failed');
        return null;
      }

      const tokenData = await response.json();
      const tokens: AuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };

      // Save tokens to config
      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      return null;
    }
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    const config = this.configService.getConfig();
    const accessToken = config.microsoft?.accessToken;
    const expiresAt = config.microsoft?.expiresAt || 0;

    // If no token or expired, try to refresh
    if (!accessToken || Date.now() >= expiresAt) {
      const refreshedTokens = await this.refreshAccessToken();
      return refreshedTokens?.accessToken || null;
    }

    return accessToken;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return !!token;
  }

  /**
   * Clear stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await this.configService.setConfig('microsoft.accessToken', '');
      await this.configService.setConfig('microsoft.refreshToken', '');
      await this.configService.setConfig('microsoft.expiresAt', 0);
      logger.info('Microsoft authentication tokens cleared');
    } catch (error) {
      logger.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Save tokens to configuration
   */
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await this.configService.setConfig('microsoft.accessToken', tokens.accessToken);
      await this.configService.setConfig('microsoft.refreshToken', tokens.refreshToken);
      await this.configService.setConfig('microsoft.expiresAt', tokens.expiresAt);
      logger.info('Microsoft authentication tokens saved');
    } catch (error) {
      logger.error('Failed to save tokens:', error);
    }
  }

  /**
   * Generate random state for OAuth2 flow
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
