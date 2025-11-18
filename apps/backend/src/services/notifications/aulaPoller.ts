// Aula Poller - Agent-generated for Epic 18
import puppeteer from 'puppeteer';
import cron from 'node-cron';
import { genAI } from '@google/generative-ai';
import { PersonalEntityRepository } from '../personal/personalRepository';  // Assume exists
import { mcpEmitter } from '../../mcp/gateway';  // For events
import { logAudit } from '../../utils/audit';  // Placeholder

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface AulaMessage {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'low';
  timestamp: string;
}

export async function pollAula(userId: string, orgId: string, credentials: { username: string; password: string }): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://aula.dk/messages', { waitUntil: 'networkidle2' });
  // Login mock - in real, use credentials
  await page.type('#username', credentials.username);
  await page.type('#password', credentials.password);
  await page.click('#login-button');

  const messages: AulaMessage[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.message-item')).map(el => ({
      id: el.id,
      title: el.querySelector('.title')?.textContent || '',
      content: el.querySelector('.body')?.textContent || '',
      priority: el.classList.contains('acute') ? 'high' : 'low',
      timestamp: new Date().toISOString()
    }));
  });
  await browser.close();

  // Fetch personal context
  const personalEntities = await PersonalEntityRepository.findByUserAndType(userId, ['self', 'family']);
  const context = personalEntities.reduce((acc, p) => ({ ...acc, [p.entity_type]: p.preferences }), {});

  for (const msg of messages.filter(m => m.priority === 'high')) {
    if (!context.consent_given) continue;  // Privacy check

    // LLM summary with personal
    const prompt = `Resumér Aula-besked: "${msg.content}". Tilpas til præferencer: ${JSON.stringify(context)}. 1 sæt, dansk.`;
    const result = await model.generateContent(prompt);
    const summary = await result.response.text();

    // Send push via MCP gateway
    await mcpEmitter.emit('aula-alert', {
      org_id: orgId,
      user_id: userId,
      title: `Akut: ${msg.title}`,
      body: summary,
      data: { aulaId: msg.id, category: 'personal' }
    });

    // Audit log
    await logAudit(orgId, userId, 'aula_notification_sent', { messageId: msg.id });
  }
}

// Schedule every 2 min
cron.schedule('*/2 * * * *', async () => {
  // Poll for all users - from DB
  const users = await getActiveUsers();  // Placeholder
  for (const user of users) {
    await pollAula(user.id, user.org_id, user.aulaCreds);
  }
});

export { pollAula };
