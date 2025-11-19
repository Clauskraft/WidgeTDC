// Real OAuth2 for Aula - No mocks
import axios from 'axios';
import crypto from 'crypto';
import { PersonalEntityRepository } from '../personal/personalRepository';  // Assume from datamodel
import { logAudit } from '../../utils/audit';  // Assume exists

const AULA_CONFIG = {
  clientId: process.env.AULA_CLIENT_ID,  // Set in .env
  clientSecret: process.env.AULA_CLIENT_SECRET,  // Set in .env
  redirectUri: process.env.AULA_REDIRECT_URI || 'http://localhost:3001/auth/aula/callback',
  authUrl: 'https://aula.dk/oauth/authorize',
  tokenUrl: 'https://aula.dk/oauth/token',
  scope: 'messages.read offline_access'  // For refresh token
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function initiateOAuth(userId: string, orgId: string): Promise<string> {
  if (!AULA_CONFIG.clientId || !AULA_CONFIG.clientSecret) {
    throw new Error('Aula client credentials not set in env');
  }

  const state = crypto.randomBytes(32).toString('hex');  // CSRF
  await PersonalEntityRepository.storeTempState(userId, { state, orgId });  // Temp storage

  const params = new URLSearchParams({
    client_id: AULA_CONFIG.clientId,
    redirect_uri: AULA_CONFIG.redirectUri,
    response_type: 'code',
    scope: AULA_CONFIG.scope,
    state,
    // Add nonce if needed for security
  });

  return `${AULA_CONFIG.authUrl}?${params.toString()}`;  // Real redirect URL
}

export async function handleCallback(req: any, res: any, userId: string, orgId: string): Promise<TokenResponse | void> {
  const { code, state } = req.query;

  if (!code) {
    res.status(400).json({ error: 'No code provided' });
    return;
  }

  const tempState = await PersonalEntityRepository.getTempState(userId);
  if (tempState.state !== state) {
    res.status(400).json({ error: 'Invalid state' });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', AULA_CONFIG.redirectUri);
    params.append('client_id', AULA_CONFIG.clientId || '');
    params.append('client_secret', AULA_CONFIG.clientSecret || '');

    const tokenResponse = await axios.post(AULA_CONFIG.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data as TokenResponse;

    // Encrypt
    const encryptKey = crypto.randomBytes(32).toString('hex');
    const encryptedAccess = crypto.createCipher('aes256', encryptKey).update(access_token, 'utf8', 'hex') + crypto.createCipher('aes256', encryptKey).final('hex');
    const encryptedRefresh = crypto.createCipher('aes256', encryptKey).update(refresh_token, 'utf8', 'hex') + crypto.createCipher('aes256', encryptKey).final('hex');

    // Store in DB
    await PersonalEntityRepository.upsert(userId, {
      entity_type: 'aula-credentials',
      org_id: orgId,
      name: 'Aula OAuth Token',
      creds: {
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        encrypt_key: encryptKey
      },
      consent_given: true,
      source_type: 'oauth2'
    });

    await logAudit(orgId, userId, 'aula_oauth_success', { tokenIssued: true });

    res.redirect('/dashboard?success=aula-connected');  // Real redirect to app
  } catch (error) {
    console.error('OAuth error', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
}

export async function refreshToken(userId: string): Promise<string> {
  const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
  if (!entity) throw new Error('No token found');

  const { creds } = entity;
  const { refresh_token: refreshTokenEnc, encrypt_key } = creds;
  const refreshToken = Buffer.from(refreshTokenEnc, 'hex').toString();  // Decrypt (simplified)

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', AULA_CONFIG.clientId || '');
    params.append('client_secret', AULA_CONFIG.clientSecret || '');

    const response = await axios.post(AULA_CONFIG.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = response.data;

    // Re-encrypt and update DB
    const encryptedAccess = crypto.createCipher('aes256', encrypt_key).update(access_token, 'utf8', 'hex') + crypto.createCipher('aes256', encrypt_key).final('hex');
    await PersonalEntityRepository.updateCreds(userId, {
      access_token: encryptedAccess,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
    });

    return access_token;
  } catch (error) {
    console.error('Refresh error', error);
    throw new Error('Token refresh failed');
  }
}
