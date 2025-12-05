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
  private readonly baseUrl: string;

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
    this.baseUrl = `https://${credentials.subdomain}.showpad.biz/api/v3/oauth2/token`;
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
      this.emit('auth_error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * OAuth 2.0 Client Credentials Flow
   * Best for server-to-server authentication
   */
  private async authenticateWithOAuth(): Promise<void> {
    const { clientId, clientSecret } = this.credentials;
    if (!clientId || !clientSecret) {
      throw new Error('Missing OAuth credentials');
    }

    const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read_content read_user_management'
    });

    const tokenData = await this.makeTokenRequest(authHeader, body);
    this.updateTokenState(tokenData);
  }

  /**
   * Username/Password Authentication (Legacy)
   * Less secure, but works without OAuth setup
   */
  private async authenticateWithPassword(): Promise<void> {
    const { username, password } = this.credentials;
    if (!username || !password) {
      throw new Error('Missing username/password credentials');
    }

    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      scope: 'read_content read_user_management'
    });

    const tokenData = await this.makeTokenRequest(undefined, body);
    this.updateTokenState(tokenData);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.state.refreshToken) {
      throw new Error('No refresh token available');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.state.refreshToken
    });

    const tokenData = await this.makeTokenRequest(undefined, body);
    this.updateTokenState(tokenData);
    this.emit('token_refreshed');
  }

  /**
   * Common method to make token requests
   */
  private async makeTokenRequest(authorization?: string, body: URLSearchParams): Promise<TokenResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Update internal state with new token data
   */
  private updateTokenState(tokenData: TokenResponse): void {
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    this.state = {
      isAuthenticated: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      scope: tokenData.scope.split(' ')
    };
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.state.expiresAt) return;

    const refreshTime = this.state.expiresAt - Date.now() - 60000; // Refresh 1 minute before expiry
    if (refreshTime <= 0) {
      this.refreshAccessToken().catch(error => this.emit('auth_error', error));
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(error => this.emit('auth_error', error));
    }, refreshTime);
  }

  /**
   * Check if OAuth credentials are available
   */
  private hasOAuthCredentials(): boolean {
    return !!(this.credentials.clientId && this.credentials.clientSecret);
  }

  /**
   * Check if username/password credentials are available
   */
  private hasPasswordCredentials(): boolean {
    return !!(this.credentials.username && this.credentials.password);
  }

  /**
   * Get current authentication state
   */
  getAuthState(): Readonly<AuthState> {
    return { ...this.state };
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.state.accessToken;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}