// Updated aulaPoller with OAuth
import cron from 'node-cron';
import axios from 'axios';
import { genAI } from '@google/generative-ai';
import { PersonalEntityRepository } from '../personal/personalRepository';
import { mcpEmitter } from '../../mcp/gateway';
import { refreshToken, handleCallback } from '../auth/aulaOAuth';  // New import
import { logAudit } from '../../utils/audit';

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface AulaMessage {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'low';
  timestamp: string;
}

export async function pollAula(userId: string, orgId: string): Promise<void> {
  let accessToken = await getStoredToken(userId);  // From DB, decrypted

  if (!accessToken || isExpired(accessToken.expires_at)) {
    accessToken = await refreshToken(userId);  // Auto-refresh
  }

  // Poll with token
  try {
    const response = await axios.get(`https://api.aula.dk/v1/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const messages: AulaMessage[] = response.data.messages || [];  // Assume API structure

    // Fetch personal context
    const personalEntities = await PersonalEntityRepository.findByUserAndType(userId, ['self', 'family']);
    const context = personalEntities.reduce((acc, p) => ({ ...acc, [p.entity_type]: p.preferences }), {});

    for (const msg of messages.filter(m => m.priority === 'high')) {
      if (!context.consent_given) continue;

      // LLM summary
      const prompt = `Resumér Aula-besked: "${msg.content}". Tilpas til præferencer: ${JSON.stringify(context)}. 1 sæt, dansk.`;
      const result = await model.generateContent(prompt);
      const summary = await result.response.text();

      // Emit via MCP
      await mcpEmitter.emit('aula-alert', {
        org_id: orgId,
        user_id: userId,
        title: `Akut: ${msg.title}`,
        body: summary,
        data: { aulaId: msg.id, category: 'personal' }
      });

      await logAudit(orgId, userId, 'aula_notification_sent', { messageId: msg.id });
    }
  } catch (error) {
    console.error('Aula poll error', error);
    // Retry logic (exponential backoff)
  }
}

async function getStoredToken(userId: string): Promise<{ access_token: string; expires_at: string }> {
  const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
  if (!entity) throw new Error('No OAuth token - initiate flow');

  const { creds } = entity;
  const encryptKey = creds.encrypt_key;
  creds.access_token = decrypt(creds.access_token, encryptKey);  // Decrypt for use
  creds.expires_at = new Date(creds.expires_at).toISOString();

  return creds;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// Schedule
cron.schedule('*/2 * * * *', async () => {
  const users = await PersonalEntityRepository.getActiveWithAula();  // Query users with aula-creds
  for (const user of users) {
    await pollAula(user.user_id, user.org_id);
  }
});
