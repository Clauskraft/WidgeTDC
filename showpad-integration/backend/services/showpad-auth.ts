/**
 * Showpad Authentication Service
 * 
 * Handles secure authentication with TDC Showpad instance
 * Supports both OAuth 2.0 (recommended) and username/password
 */

import { EventEmitter } from 'events';

interface ShowpadCredentials {
  subdomain: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  scope: string[];
}

export class ShowpadAuthService extends EventEmitter {
  private credentials: ShowpadCredentials;
  private state: AuthState;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(credentials: ShowpadCredentials) {
    super();
    this.credentials = credentials;
    this.state = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      scope: []
    };
  }

  /**
   * Authenticate using available credentials
   * Tries OAuth first, falls back to username/password
   */
  async authenticate(): Promise<void> {
    try {
      if (this.hasOAuthCredentials()) {
        await this.authenticateWithOAuth();
      } else if (this.hasPasswordCredentials()) {
        await this.authenticateWithPassword();
      } else {
        throw new Error('No valid credentials provided');
      }

      this.emit('authenticated', { scope: this.state.scope });
      this.scheduleTokenRefresh();
    } catch (error) {
      this.emit('auth_error', error);
      throw error;
    }
  }

  /**
   * OAuth 2.0 Client Credentials Flow
   * Best for server-to-server authentication
   */
  private async authenticateWithOAuth(): Promise<void> {
    const response = await fetch(
      `https://${this.credentials.subdomain}.showpad.biz/api/v3/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${this.credentials.clientId}:${this.credentials.clientSecret}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'read_content read_user_management'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth authentication failed: ${error}`);
    }

    const tokenData: TokenResponse = await response.json();
    this.updateTokenState(tokenData);
  }

  /**
   * Username/Password Authentication (Legacy)
   * Less secure, but works without OAuth setup
   */
  private async authenticateWithPassword(): Promise<void> {
    const response = await fetch(
      `https://${this.credentials.subdomain}.showpad.biz/api/v3/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.credentials.username!,
          password: this.credentials.password!,
          scope: 'read_content read_user_management'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Password authentication failed: ${error}`);
    }

    const tokenData: TokenResponse = await response.json();
    this.updateTokenState(tokenData);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.state.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(
      `https://${this.credentials.subdomain}.showpad.biz/api/v3/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.hasOAuthCredentials() 
            ? 'Basic ' + Buffer.from(
                `${this.credentials.clientId}:${this.credentials.clientSecret}`
              ).toString('base64')
            : undefined
        } as any,
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.state.refreshToken
        })
      }
    );

    if (!response.ok) {
      // Refresh failed - need to re-authenticate
      this.emit('token_refresh_failed');
      await this.authenticate();
      return;
    }

    const tokenData: TokenResponse = await response.json();
    this.updateTokenState(tokenData);
    this.emit('token_refreshed');
  }

  /**
   * Update internal state with new token data
   */
  private updateTokenState(tokenData: TokenResponse): void {
    this.state.accessToken = tokenData.access_token;
    this.state.refreshToken = tokenData.refresh_token;
    this.state.expiresAt = Date.now() + (tokenData.expires_in * 1000);
    this.state.scope = tokenData.scope.split(' ');
    this.state.isAuthenticated = true;
  }

  /**
   * Schedule automatic token refresh before expiration
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.state.expiresAt) return;

    // Refresh 5 minutes before expiration
    const refreshIn = this.state.expiresAt - Date.now() - (5 * 60 * 1000);

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken().catch(error => {
          this.emit('token_refresh_error', error);
        });
      }, refreshIn);
    }
  }

  /**
   * Get current access token (refreshes if expired)
   */
  async getAccessToken(): Promise<string> {
    if (!this.state.isAuthenticated) {
      await this.authenticate();
    }

    // Check if token is expired or about to expire (1 minute buffer)
    if (this.state.expiresAt && (this.state.expiresAt - Date.now()) < 60000) {
      await this.refreshAccessToken();
    }

    if (!this.state.accessToken) {
      throw new Error('No access token available');
    }

    return this.state.accessToken;
  }

  /**
   * Make authenticated API request to Showpad
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const apiVersion = process.env.SHOWPAD_API_VERSION || 'v4';

    const response = await fetch(
      `https://${this.credentials.subdomain}.api.showpad.com/${apiVersion}${endpoint}`,
      {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Showpad API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check if OAuth credentials are available
   */
  private hasOAuthCredentials(): boolean {
    return !!(this.credentials.clientId && this.credentials.clientSecret);
  }

  /**
   * Check if password credentials are available
   */
  private hasPasswordCredentials(): boolean {
    return !!(this.credentials.username && this.credentials.password);
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && 
           !!this.state.accessToken &&
           (!this.state.expiresAt || this.state.expiresAt > Date.now());
  }

  /**
   * Revoke current tokens and clear state
   */
  async logout(): Promise<void> {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Reset state
    this.state = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      scope: []
    };

    this.emit('logged_out');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.removeAllListeners();
  }
}

/**
 * Factory function to create ShowpadAuthService from environment variables
 */
export function createShowpadAuthFromEnv(): ShowpadAuthService {
  const credentials: ShowpadCredentials = {
    subdomain: process.env.SHOWPAD_SUBDOMAIN || 'tdcerhverv',
    username: process.env.SHOWPAD_USERNAME,
    password: process.env.SHOWPAD_PASSWORD,
    clientId: process.env.SHOWPAD_CLIENT_ID,
    clientSecret: process.env.SHOWPAD_CLIENT_SECRET
  };

  if (!credentials.subdomain) {
    throw new Error('SHOWPAD_SUBDOMAIN environment variable is required');
  }

  return new ShowpadAuthService(credentials);
}

// Example usage:
// const auth = createShowpadAuthFromEnv();
// await auth.authenticate();
// const assets = await auth.request('/assets');
