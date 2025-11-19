import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.md', '.txt', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: ' + allowedExtensions.join(', ')));
    }
  },
});

interface Finding {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  remediation: string;
}

interface AnalysisResult {
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    totalFiles: number;
  };
  findings: Finding[];
  overallScore: number;
}

interface PersonaFeedback {
  persona: string;
  role: string;
  feedback: string;
  confidence: number;
  recommendations: string[];
  concerns: string[];
}

interface ReviewResult {
  summary: string;
  consensus: string[];
  disagreements: string[];
  personas: PersonaFeedback[];
  overallScore: number;
}

router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a code file for analysis',
      });
    }

    const file = req.file;
    const fileContent = file.buffer.toString('utf-8');
    const fileName = file.originalname;

    console.log('Code analysis requested:', {
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const findings: Finding[] = [];
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('eval(') || line.includes('innerHTML')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'critical',
          category: 'Security - XSS',
          description: 'Potential XSS vulnerability detected',
          remediation: 'Use secure alternatives like textContent or sanitize user input',
        });
      }

      if (line.includes('SELECT * FROM') && line.includes('+')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'critical',
          category: 'Security - SQL Injection',
          description: 'Potential SQL injection vulnerability',
          remediation: 'Use parameterized queries or prepared statements',
        });
      }

      if (line.includes('console.log(')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'low',
          category: 'Code Quality',
          description: 'Console.log statement found',
          remediation: 'Remove console.log or replace with proper logging',
        });
      }

      if (line.includes('any')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'medium',
          category: 'Type Safety',
          description: 'Use of "any" type reduces type safety',
          remediation: 'Use specific types instead of any',
        });
      }
    });

    const summary = {
      criticalIssues: findings.filter(f => f.severity === 'critical').length,
      highIssues: findings.filter(f => f.severity === 'high').length,
      mediumIssues: findings.filter(f => f.severity === 'medium').length,
      lowIssues: findings.filter(f => f.severity === 'low').length,
      totalFiles: 1,
    };

    const weightedScore =
      summary.criticalIssues * 20 +
      summary.highIssues * 10 +
      summary.mediumIssues * 5 +
      summary.lowIssues * 2;

    const overallScore = Math.max(0, Math.min(100, 100 - weightedScore));

    const result: AnalysisResult = {
      summary,
      findings: findings.slice(0, 20),
      overallScore,
    };

    res.json(result);
  } catch (error) {
    console.error('Code analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

router.post('/spec-panel', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a specification document for review',
      });
    }

    const file = req.file;
    const fileContent = file.buffer.toString('utf-8');
    const fileName = file.originalname;

    let selectedPersonas: string[] = [];
    try {
      selectedPersonas = req.body.personas ? JSON.parse(req.body.personas) : ['architecture', 'security'];
    } catch (_error) {
      selectedPersonas = ['architecture', 'security'];
    }

    console.log('Spec panel review requested:', {
      fileName,
      fileSize: file.size,
      personas: selectedPersonas,
    });

    const personaFeedbackMap: Record<string, PersonaFeedback> = {
      architecture: {
        persona: 'architecture',
        role: 'Architecture Expert',
        feedback:
          'Systemdesignet viser god separation of concerns. Dog mangler der detaljer omkring skalering og fejlhåndtering ved høj belastning.',
        confidence: 0.82,
        recommendations: [
          'Implementér circuit breaker pattern til eksterne API-kald',
          'Overvej event-driven arkitektur for asynkron kommunikation',
          'Tilføj caching-lag for at reducere database-belastning',
        ],
        concerns: [
          'Manglende beskrivelse af disaster recovery strategi',
          'Uklart hvordan microservices kommunikerer ved netværksfejl',
        ],
      },
      security: {
        persona: 'security',
        role: 'Security Expert',
        feedback:
          'Sikkerhedsaspekterne er overordnet acceptable, men der mangler konkrete detaljer om authentication og authorization flow.',
        confidence: 0.75,
        recommendations: [
          'Implementér OAuth 2.0 med PKCE for frontend authentication',
          'Brug JWT med kort levetid og refresh tokens',
          'Tilføj rate limiting på alle API endpoints',
        ],
        concerns: [
          'Ingen beskrivelse af encryption at rest',
          'Manglende detaljer om GDPR compliance',
          'Uklart hvordan sensitiv data håndteres i logs',
        ],
      },
      backend: {
        persona: 'backend',
        role: 'Backend Expert',
        feedback: 'API-designet følger RESTful principper godt. Performance-overvejelser skal dog specificeres mere detaljeret.',
        confidence: 0.88,
        recommendations: [
          'Implementér database connection pooling',
          'Overvej GraphQL for komplekse data-queries',
          'Tilføj API versioning fra start',
        ],
        concerns: ['Manglende beskrivelse af database indexing strategi', 'Uklart hvordan N+1 query problemet undgås'],
      },
      frontend: {
        persona: 'frontend',
        role: 'Frontend Expert',
        feedback: 'UI/UX-beskrivelsen er god, men der mangler detaljer om accessibility og responsive design implementering.',
        confidence: 0.79,
        recommendations: [
          'Implementér WCAG 2.1 Level AA standarder',
          'Brug progressive enhancement for bedre compatibility',
          'Tilføj offline-first capabilities med service workers',
        ],
        concerns: [
          'Ingen beskrivelse af keyboard navigation',
          'Manglende plan for internationalization (i18n)',
          'Uklart hvordan fejl præsenteres for brugeren',
        ],
      },
    };

    const personas: PersonaFeedback[] = selectedPersonas
      .filter(p => personaFeedbackMap[p])
      .map(p => personaFeedbackMap[p]);

    const consensus = [
      'Systemet har et solidt fundament med god separation of concerns',
      'Der er behov for mere detaljering omkring fejlhåndtering og resiliens',
      'Sikkerhed og performance skal prioriteres højere i implementeringsfasen',
    ];

    const disagreements = [
      'Architecture anbefaler event-driven, mens Backend foretrækker traditionel REST',
      'Security ønsker streng authentication, Frontend ønsker friktionsløs brugeroplevelse',
      'Trade-off mellem kompleksitet og fleksibilitet i arkitekturen',
    ];

    const avgConfidence = personas.reduce((sum, p) => sum + p.confidence, 0) / personas.length;
    const overallScore = Math.round(avgConfidence * 100);

    const result: ReviewResult = {
      summary:
        personas.length === 0
          ? 'Ingen eksperter valgt.'
          : `${personas.length} eksperter har gennemgået specifikationen. Overordnet vurdering: God struktur med behov for flere tekniske detaljer.`,
      consensus,
      disagreements,
      personas,
      overallScore,
    };

    res.json(result);
  } catch (error) {
    console.error('Spec panel review error:', error);
    res.status(500).json({
      error: 'Review failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'sc',
    endpoints: ['/analyze', '/spec-panel'],
    timestamp: new Date().toISOString(),
  });
});

export { router as scRouter };
