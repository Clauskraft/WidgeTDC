// OAuth2 for Aula - Agent-generated
import axios from 'axios';
import crypto from 'crypto';
import { PersonalEntityRepository } from '../personal/personalRepository';
import { logAudit } from '../../utils/audit';

const AULA_CONFIG = {
  clientId: process.env.AULA_CLIENT_ID!,  // From env
  clientSecret: process.env.AULA_CLIENT_SECRET!,  // From env
  redirectUri: 'http://localhost:3001/api/auth/aula/callback',  // Local dev
  authUrl: 'https://aula.dk/oauth/authorize',
  tokenUrl: 'https://aula.dk/oauth/token',
  scope: 'messages.read'  // For beskeder
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function initiateOAuth(userId: string, orgId: string): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex');  // CSRF protection
  const authUrl = `${AULA_CONFIG.authUrl}?client_id=${AULA_CONFIG.clientId}&redirect_uri=${encodeURIComponent(AULA_CONFIG.redirectUri)}&response_type=code&scope=${AULA_CONFIG.scope}&state=${state}`;
  
  // Store state temporarily (in session/DB)
  await PersonalEntityRepository.storeTempState(userId, { state, orgId });

  return authUrl;  // Redirect user to this
}

export async function handleCallback(code: string, state: string, userId: string, orgId: string): Promise<TokenResponse> {
  // Verify state
  const tempState = await PersonalEntityRepository.getTempState(userId);
  if (tempState.state !== state) throw new Error('Invalid state');

  // Exchange code for token
  const response = await axios.post(AULA_CONFIG.tokenUrl, new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: AULA_CONFIG.redirectUri,
    client_id: AULA_CONFIG.clientId,
    client_secret: AULA_CONFIG.clientSecret
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  const { access_token, refresh_token, expires_in } = response.data;

  // Encrypt tokens
  const encryptKey = crypto.randomBytes(32);  // Derive from user JWT or env
  const encryptedAccess = encrypt(access_token, encryptKey.toString('hex'));
  const encryptedRefresh = encrypt(refresh_token, encryptKey.toString('hex'));

  // Store in personal_entities (entity_type: 'aula-credentials')
  await PersonalEntityRepository.upsert(userId, {
    entity_type: 'aula-credentials',
    org_id: orgId,
    name: 'Aula Access',
    creds: {
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      encrypt_key: encryptKey.toString('hex')  // Store key too (rotate periodically)
    },
    consent_given: true,
    source_type: 'oauth'
  });

  // Audit
  await logAudit(orgId, userId, 'aula_oauth_success', { code: code.substring(0, 10) + '...' });

  return { access_token, refresh_token, expires_in };  // Return for frontend
}

function encrypt(text: string, key: string): string {
  const cipher = crypto.createCipher('aes256', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string, key: string): string {
  const decipher = crypto.createDecipher('aes256', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function refreshToken(userId: string): Promise<string> {
  const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
  if (!entity) throw new Error('No token');

  const { refresh_token: refreshTokenEnc, encrypt_key } = entity.creds;
  const refreshToken = decrypt(refreshTokenEnc, encrypt_key);

  const response = await axios.post(AULA_CONFIG.tokenUrl, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: AULA_CONFIG.clientId,
    client_secret: AULA_CONFIG.clientSecret
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  const { access_token, expires_in } = response.data;

  // Update DB
  const encryptedAccess = encrypt(access_token, encrypt_key);
  await PersonalEntityRepository.updateCreds(userId, { access_token: encryptedAccess, expires_at: new Date(Date.now() + expires_in * 1000).toISOString() });

  return access_token;
}
