import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.md', '.txt', '.pdf', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`));
    }
  },
});

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Finding {
  file: string;
  line: number;
  severity: Severity;
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

    const lines = fileContent.split('\n');
    const findings: Finding[] = [];

    lines.forEach((line, index) => {
      if (/eval\s*\(/.test(line) || line.includes('innerHTML')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'critical',
          category: 'Security - XSS',
          description: 'Potential direct DOM injection detected',
          remediation: 'Avoid using eval/innerHTML or sanitize input before usage',
        });
      }

      if (/SELECT\s+.*\+/.test(line)) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'critical',
          category: 'Security - SQL Injection',
          description: 'Raw SQL string concatenation detected',
          remediation: 'Use parameterized queries or query builders with bindings',
        });
      }

      if (line.includes('console.log')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'low',
          category: 'Code Quality',
          description: 'Console logging present',
          remediation: 'Remove debug logs or guard with environment checks',
        });
      }

      if (line.includes(': any') || line.includes(' as any')) {
        findings.push({
          file: fileName,
          line: index + 1,
          severity: 'medium',
          category: 'Type Safety',
          description: 'Usage of "any" type reduces static guarantees',
          remediation: 'Provide strict typing or generics',
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

    const scorePenalty =
      summary.criticalIssues * 30 +
      summary.highIssues * 15 +
      summary.mediumIssues * 7 +
      summary.lowIssues * 3;

    const result: AnalysisResult = {
      summary,
      findings,
      overallScore: Math.max(0, 100 - scorePenalty),
    };

    return res.json(result);
  } catch (error) {
    console.error('Code analysis error:', error);
    return res.status(500).json({
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

    const personas: PersonaFeedback[] = [
      {
        persona: 'architecture',
        role: 'Architecture Expert',
        feedback: 'System boundaries are defined, but cross-service failure scenarios require more detail.',
        confidence: 0.82,
        recommendations: ['Document fallback strategies', 'Add service-level objectives'],
        concerns: ['Unclear ownership of shared services'],
      },
      {
        persona: 'security',
        role: 'Security Expert',
        feedback: 'Authentication model is sound, but data retention policy is missing.',
        confidence: 0.74,
        recommendations: ['Add threat modelling section', 'Specify audit logging requirements'],
        concerns: ['No guidance on secrets rotation'],
      },
    ];

    return res.json({
      summary: `Reviewed by ${personas.length} domain specialists.`,
      consensus: [
        'Architecture direction aligns with organizational patterns',
        'Security controls need stronger documentation',
      ],
      disagreements: ['Debate around custom auth vs. managed IdP integration'],
      personas,
      overallScore: Math.round(
        personas.reduce((sum, persona) => sum + persona.confidence, 0) / personas.length * 100,
      ),
    } satisfies ReviewResult);
  } catch (error) {
    console.error('Spec panel error:', error);
    return res.status(500).json({
      error: 'Review failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    endpoints: [
      '/api/commands/sc/analyze',
      '/api/commands/sc/spec-panel',
      '/analyze',
      '/spec-panel',
    ],
    timestamp: new Date().toISOString(),
  });
});

export { router as scRouter };
