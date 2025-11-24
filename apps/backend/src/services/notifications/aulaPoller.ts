// TODO: Re-enable when dependencies (personalRepository, audit utils) are implemented
/*
// Real Aula Poller - No mocks, live API calls
import cron from 'node-cron';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
// import { PersonalEntityRepository } from '../personal/personalRepository.js';
// import { mcpEmitter } from '../../mcp/gateway.js';
// import { refreshToken } from '../auth/aulaOAuth.js';
// import { logAudit } from '../../utils/audit.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface AulaMessage {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'low';  // Infer from tags or sender
  timestamp: string;
}

export async function pollAula(userId: string, orgId: string): Promise<void> {
  // Implementation commented out due to missing dependencies
}
*/
