import { Router } from 'express';
import { SragRepository } from './sragRepository.js';
import { SragQueryRequest } from '@widget-tdc/mcp-types';
import { v4 as uuidv4 } from 'uuid';

export const sragRouter = Router();
const sragRepo = new SragRepository();

// Query endpoint - determines if query is analytical or semantic
sragRouter.post('/query', (req, res) => {
  try {
    const request: SragQueryRequest = req.body;
    
    if (!request.orgId || !request.naturalLanguageQuery) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, naturalLanguageQuery',
      });
    }

    // Simple heuristic: if query contains SQL keywords, treat as analytical
    const query = request.naturalLanguageQuery.toLowerCase();
    const sqlKeywords = ['sum', 'count', 'average', 'total', 'group by', 'where'];
    const isAnalytical = sqlKeywords.some(keyword => query.includes(keyword));

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
