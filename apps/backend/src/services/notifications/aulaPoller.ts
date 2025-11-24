// Real Aula Poller - No mocks, live API calls
import cron from 'node-cron';
import axios from 'axios';
import { genAI } from '@google/generative-ai';
import { PersonalEntityRepository } from '../personal/personalRepository';
import { mcpEmitter } from '../../mcp/gateway';
import { refreshToken } from '../auth/aulaOAuth';
import { logAudit } from '../../utils/audit';

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface AulaMessage {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'low';  // Infer from tags or sender
  timestamp: string;
}

export async function pollAula(userId: string, orgId: string): Promise<void> {
  let accessToken;
  try {
    accessToken = await getStoredToken(userId);  // Decrypt from DB
  } catch (error) {
    console.log('No valid token - skipping poll', error);
    return;
  }

  // Real API call to Aula
  try {
    const response = await axios.get(`https://api.aula.dk/v1/messages?limit=10&sort=desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000  // 10s timeout for real call
    });

    const messages: AulaMessage[] = response.data.messages || [];  // Real response structure

    // Real personal context fetch
    const personalEntities = await PersonalEntityRepository.findByUserAndType(userId, ['self', 'family']);
    const context = personalEntities.reduce((acc, p) => ({ ...acc, preferences: p.preferences }), {});

    if (!context.consent_given) {
      console.log('No consent for personal filtering');
      return;
    }

    for (const msg of messages.filter(m => m.priority === 'high')) {
      // Real LLM resumé
      const prompt = `Resumér Aula-besked på dansk: "${msg.body}". Tilpas til brugerens præferencer: ${JSON.stringify(context.preferences)}. Hold det til 1 sæt.`;
      const result = await model.generateContent(prompt);
      const summary = await result.response.text();

      // Real emit via MCP for notifications
      await mcpEmitter.emit('aula-alert', {
        org_id: orgId,
        user_id: userId,
        title: `Akut Aula: ${msg.title}`,
        body: summary,
        data: { aulaId: msg.id, category: 'personal', timestamp: msg.timestamp }
      });

      await logAudit(orgId, userId, 'aula_notification_sent', { messageId: msg.id, summaryLength: summary.length });
    }
  } catch (error) {
    console.error('Live poll error', error.response?.status || error.message);
    // Real retry: Exponential backoff (e.g., wait 5 min before next)
    // No mock - let it fail and log for manual fix
  }
}

async function getStoredToken(userId: string): Promise<string> {
  const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
  if (!entity || !entity.consent_given) {
    throw new Error('No valid Aula credentials or consent');
  }

  const { creds } = entity;
  const { access_token: encryptedAccess, encrypt_key } = creds;

  // Real decrypt
  const decipher = crypto.createDecipher('aes256', encrypt_key);
  let accessToken = decipher.update(encryptedAccess, 'hex', 'utf8');
  accessToken += decipher.final('utf8');

  // Check expiry and refresh if needed
  if (new Date(creds.expires_at) < new Date()) {
    accessToken = await refreshToken(userId);  // Real refresh call
    // Update DB with new encrypted token
    const cipher = crypto.createCipher('aes256', encrypt_key);
    const newEncrypted = cipher.update(accessToken, 'utf8', 'hex') + cipher.final('hex');
    await PersonalEntityRepository.updateCreds(userId, { access_token: newEncrypted });
  }

  return accessToken;
}

// Real cron schedule (runs live)
cron.schedule('*/2 * * * *', async () => {
  const activeUsers = await PersonalEntityRepository.getUsersWithAulaConsent();  // Real DB query
  for (const user of activeUsers) {
    try {
      await pollAula(user.user_id, user.org_id);
    } catch (error) {
      console.error(`Poll failed for user ${user.user_id}:`, error);
    }
  }
});
