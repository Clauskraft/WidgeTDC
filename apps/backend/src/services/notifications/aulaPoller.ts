import cron from 'node-cron';
import axios from 'axios';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PersonalEntityRepository, type PersonalEntity } from '../personal/personalRepository';
import { mcpEmitter } from '../../mcp/gateway';
import { refreshToken } from '../auth/aulaOAuth';
import { logAudit } from '../../utils/audit';

interface AulaMessage {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'low';
  timestamp: string;
}

interface PollOptions {
  accessToken?: string;
  messageLimit?: number;
}

let aulaModelOverride: GenerativeModel | null = null;
let cachedAulaModel: GenerativeModel | null = null;

function resolveModel(): GenerativeModel {
  if (aulaModelOverride) {
    return aulaModelOverride;
  }

  if (cachedAulaModel) {
    return cachedAulaModel;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Provide a key or call __setAulaModel for tests.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  cachedAulaModel = client.getGenerativeModel({ model: 'gemini-pro' });
  return cachedAulaModel;
}

function normaliseEntities(result: PersonalEntity | PersonalEntity[] | null): PersonalEntity[] {
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

async function buildPersonalContext(userId: string): Promise<{ consentGranted: boolean; preferences: Record<string, unknown> }> {
  const matches = await PersonalEntityRepository.findByUserAndType(userId, ['self', 'family']);
  const entities = normaliseEntities(matches);

  const consentGranted = entities.some(entity => entity.consent_given);
  const preferences = entities
    .filter(entity => entity.preferences)
    .reduce<Record<string, unknown>>((acc, entity) => ({ ...acc, ...entity.preferences }), {});

  return { consentGranted, preferences };
}

async function ensureToken(userId: string): Promise<string> {
  const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
  if (!entity || !entity.consent_given) {
    throw new Error('No Aula credentials with consent');
  }

  const accessToken = entity.creds?.access_token;
  if (!accessToken) {
    throw new Error('Stored Aula credentials missing access token');
  }

  const expiry = entity.creds?.expires_at ? new Date(entity.creds.expires_at) : undefined;
  if (expiry && expiry < new Date()) {
    const refreshed = await refreshToken(userId);
    await PersonalEntityRepository.updateCreds(userId, {
      access_token: refreshed,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    return refreshed;
  }

  return accessToken;
}

async function summariseMessage(message: AulaMessage, preferences: Record<string, unknown>): Promise<string> {
  const prompt = `Resumér Aula-besked på dansk i ét kort afsnit.\nBesked: "${message.body}".\nTitel: "${message.title}".\nTilpas til følgende præferencer: ${JSON.stringify(preferences)}.`;
  const model = resolveModel();
  const result = await model.generateContent(prompt);
  return await result.response.text();
}

export async function pollAula(userId: string, orgId: string, options?: PollOptions): Promise<void> {
  let token: string;
  try {
    token = options?.accessToken ?? (await ensureToken(userId));
  } catch (error) {
    console.warn('Aula poll skipped - unable to resolve token', error);
    return;
  }

  try {
    const response = await axios.get('https://api.aula.dk/v1/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        limit: options?.messageLimit ?? 10,
        sort: 'desc',
      },
      timeout: 10_000,
    });

    const messages: AulaMessage[] = response.data?.messages ?? [];
    if (messages.length === 0) {
      return;
    }

    const context = await buildPersonalContext(userId);
    if (!context.consentGranted) {
      console.info('Skipping Aula notifications due to missing consent');
      return;
    }

    const urgentMessages = messages.filter(message => message.priority === 'high');
    for (const message of urgentMessages) {
      const summary = await summariseMessage(message, context.preferences);
      await mcpEmitter.emit('aula-alert', {
        org_id: orgId,
        user_id: userId,
        title: `Akut Aula: ${message.title}`,
        body: summary,
        data: { aulaId: message.id, category: 'personal', timestamp: message.timestamp },
      });

      await logAudit(orgId, userId, 'aula_notification_sent', {
        messageId: message.id,
        summaryLength: summary.length,
      });
    }
  } catch (error: any) {
    const status = error?.response?.status;
    console.error('Aula poll failed', status ?? error?.message ?? error);
  }
}

export function __setAulaModel(model: GenerativeModel | null): void {
  aulaModelOverride = model;
  cachedAulaModel = model;
}

if (process.env.NODE_ENV !== 'test') {
  cron.schedule('*/2 * * * *', async () => {
    const activeUsers = await PersonalEntityRepository.getUsersWithAulaConsent();
    for (const user of activeUsers) {
      try {
        await pollAula(user.user_id, user.org_id);
      } catch (error) {
        console.error(`Poll failed for user ${user.user_id}:`, error);
      }
    }
  });
}
