import { Router } from 'express';
import { SragRepository } from './sragRepository.js';
import { SragQueryRequest } from '@widget-tdc/mcp-types';
import { v4 as uuidv4 } from 'uuid';

export const sragRouter = Router();
const sragRepo = new SragRepository();

// Enhanced query classification with ML-like features
function classifyQueryType(query: string): { type: 'analytical' | 'semantic'; confidence: number; features: string[] } {
  const lowerQuery = query.toLowerCase();

  // Analytical indicators with weights
  const analyticalPatterns = [
    { pattern: /\b(sum|count|average|total|maximum|minimum|max|min|avg)\b/g, weight: 3 },
    { pattern: /\b(group by|order by|where|having|join|union)\b/g, weight: 2 },
    { pattern: /\b(compare|comparison|difference|delta|change|vs|versus)\b/g, weight: 2 },
    { pattern: /\b(calculate|compute|aggregate|breakdown)\b/g, weight: 2 },
    { pattern: /\b(last|previous|current|this|quarter|month|year|period)\b/g, weight: 1 },
    { pattern: /\b(cost|spend|revenue|profit|budget|expense)\b/g, weight: 1.5 },
  ];

  // Semantic indicators with weights
  const semanticPatterns = [
    { pattern: /\b(explain|describe|what is|how does|why)\b/g, weight: 3 },
    { pattern: /\b(meaning|definition|concept|overview|summary)\b/g, weight: 2 },
    { pattern: /\b(impact|effect|influence|consequence)\b/g, weight: 2 },
    { pattern: /\b(find|locate|search|discover|explore)\b/g, weight: 1.5 },
    { pattern: /\b(understand|clarify|elaborate|detail)\b/g, weight: 1.5 },
  ];

  let analyticalScore = 0;
  let semanticScore = 0;
  const features: string[] = [];

  // Calculate analytical score
  analyticalPatterns.forEach(({ pattern, weight }) => {
    const matches = lowerQuery.match(pattern);
    if (matches) {
      analyticalScore += matches.length * weight;
      features.push(`analytical: ${pattern.source} (${matches.length})`);
    }
  });

  // Calculate semantic score
  semanticPatterns.forEach(({ pattern, weight }) => {
    const matches = lowerQuery.match(pattern);
    if (matches) {
      semanticScore += matches.length * weight;
      features.push(`semantic: ${pattern.source} (${matches.length})`);
    }
  });

  // Length-based heuristic (longer queries tend to be semantic)
  const wordCount = query.split(/\s+/).length;
  if (wordCount > 10) {
    semanticScore += 1;
    features.push(`length: ${wordCount} words`);
  }

  // Question mark heuristic
  if (query.includes('?')) {
    semanticScore += 2;
    features.push('question_mark');
  }

  // Calculate confidence and determine type
  const totalScore = analyticalScore + semanticScore;
  const confidence = totalScore > 0 ? Math.max(analyticalScore, semanticScore) / totalScore : 0.5;

  const type = analyticalScore > semanticScore ? 'analytical' : 'semantic';

  return { type, confidence, features };
}

// Query endpoint - determines if query is analytical or semantic
sragRouter.post('/query', (req, res) => {
  try {
    const request: SragQueryRequest = req.body;

    if (!request.orgId || !request.naturalLanguageQuery) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, naturalLanguageQuery',
      });
    }

    // Enhanced ML-based query classification with confidence scoring
    const classification = classifyQueryType(request.naturalLanguageQuery);
    const isAnalytical = classification.type === 'analytical';

    const traceId = uuidv4();

    if (isAnalytical) {
      // For analytical queries, query structured facts
      const facts = sragRepo.queryFacts(request.orgId);

      res.json({
        type: 'analytical',
        result: facts,
        sqlQuery: 'SELECT * FROM structured_facts WHERE org_id = ?',
        metadata: {
          traceId,
          docIds: facts.map(f => f.doc_id).filter(Boolean),
          classification: classification,
        },
      });
    } else {
      // For semantic queries, search documents
      const keywords = query.split(' ').filter((w: string) => w.length > 3);
      const documents = keywords.length > 0
        ? sragRepo.searchDocuments(request.orgId, keywords[0])
        : [];

      res.json({
        type: 'semantic',
        result: documents,
        sqlQuery: null,
        metadata: {
          traceId,
          docIds: documents.map(d => d.id),
          classification: classification,
        },
      });
    }
  } catch (error: any) {
    console.error('SRAG query error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ingest document
sragRouter.post('/ingest/document', (req, res) => {
  try {
    const input = req.body;
    const docId = sragRepo.ingestDocument(input);

    res.json({
      success: true,
      docId,
    });
  } catch (error: any) {
    console.error('Document ingest error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ingest structured fact
sragRouter.post('/ingest/fact', (req, res) => {
  try {
    const input = req.body;
    const factId = sragRepo.ingestFact(input);

    res.json({
      success: true,
      factId,
    });
  } catch (error: any) {
    console.error('Fact ingest error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
