/**
 * 🧠 KNOWLEDGE GRAPH SERVICE
 * Gemmer harvested filer i Neo4j som et selvbevidst knowledge graph
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

interface FileNode {
  path: string;
  name: string;
  extension: string;
  content: string;
  hash: string;
  lines: number;
  size: number;
}

interface GraphStats {
  totalNodes: number;
  totalRelationships: number;
  filesByType: Record<string, number>;
  importGraph: { from: string; to: string }[];
}

export class KnowledgeGraph {
  private driver: Driver;
  
  constructor() {
    const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log('🧠 KnowledgeGraph connected to Neo4j');
  }

  /**
   * Ingest alle filer som nodes i grafen
   */
  async ingestFiles(files: FileNode[]): Promise<{ created: number; updated: number }> {
    const session = this.driver.session();
    let created = 0;
    let updated = 0;

    try {
      // Batch ingest for performance
      for (const file of files) {
        const result = await session.run(`
          MERGE (f:File {path: $path})
          ON CREATE SET 
            f.name = $name,
            f.extension = $extension,
            f.hash = $hash,
            f.lines = $lines,
            f.size = $size,
            f.content = $content,
            f.createdAt = datetime(),
            f.updatedAt = datetime()
          ON MATCH SET
            f.hash = $hash,
            f.lines = $lines,
            f.size = $size,
            f.content = $content,
            f.updatedAt = datetime()
          RETURN f.path AS path, 
                 CASE WHEN f.createdAt = f.updatedAt THEN 'created' ELSE 'updated' END AS action
        `, {
          path: file.path,
          name: file.name,
          extension: file.extension,
          hash: file.hash,
          lines: file.lines,
          size: file.size,
          content: file.content.substring(0, 50000) // Truncate for Neo4j
        });

        const action = result.records[0]?.get('action');
        if (action === 'created') created++;
        else updated++;
      }

      // Create directory hierarchy
      await this.createDirectoryHierarchy(session);
      
      // Extract and create import relationships
      await this.extractImportRelationships(session);

      console.log(`✅ Ingested ${created} new, ${updated} updated files`);
      return { created, updated };

    } finally {
      await session.close();
    }
  }

  /**
   * Opret mappe-hierarki som nodes
   */
  private async createDirectoryHierarchy(session: Session): Promise<void> {
    await session.run(`
      MATCH (f:File)
      WITH f, split(f.path, '/') AS parts
      UNWIND range(1, size(parts)-1) AS idx
      WITH f, reduce(s = '', i IN range(0, idx-1) | s + '/' + parts[i]) AS dirPath
      WHERE dirPath <> ''
      MERGE (d:Directory {path: dirPath})
      MERGE (f)-[:IN_DIRECTORY]->(d)
    `);

    // Parent directory relationships
    await session.run(`
      MATCH (d:Directory)
      WITH d, split(d.path, '/') AS parts
      WHERE size(parts) > 2
      WITH d, reduce(s = '', i IN range(0, size(parts)-2) | s + '/' + parts[i]) AS parentPath
      WHERE parentPath <> ''
      MERGE (p:Directory {path: parentPath})
      MERGE (d)-[:SUBDIRECTORY_OF]->(p)
    `);
  }

  /**
   * Ekstraher import statements og opret relationer
   */
  private async extractImportRelationships(session: Session): Promise<void> {
    // TypeScript/JavaScript imports
    await session.run(`
      MATCH (f:File)
      WHERE f.extension IN ['.ts', '.tsx', '.js', '.jsx']
      WITH f, f.content AS content
      
      // Match import statements
      WITH f, 
           [x IN split(content, '\n') WHERE x CONTAINS 'import ' AND x CONTAINS 'from'] AS imports
      UNWIND imports AS importLine
      
      // Extract the path from import
      WITH f, importLine,
           trim(split(split(importLine, 'from')[1], ';')[0]) AS rawPath
      WHERE rawPath IS NOT NULL AND rawPath <> ''
      
      // Clean quotes
      WITH f, replace(replace(rawPath, '"', ''), "'", '') AS importPath
      WHERE importPath STARTS WITH '.' OR importPath STARTS WITH '/'
      
      // Try to find matching file
      OPTIONAL MATCH (target:File)
      WHERE target.path CONTAINS split(importPath, '/')[-1]
      
      FOREACH (_ IN CASE WHEN target IS NOT NULL THEN [1] ELSE [] END |
        MERGE (f)-[:IMPORTS]->(target)
      )
    `);
  }

  /**
   * Hent graf statistikker
   */
  async getStats(): Promise<GraphStats> {
    const session = this.driver.session();
    
    try {
      // Total counts
      const countResult = await session.run(`
        MATCH (f:File) 
        RETURN count(f) AS files,
               count { MATCH ()-[r:IMPORTS]->() RETURN r } AS imports,
               count { MATCH ()-[r:IN_DIRECTORY]->() RETURN r } AS dirRels
      `);
      
      const counts = countResult.records[0];
      
      // Files by extension
      const extResult = await session.run(`
        MATCH (f:File)
        RETURN f.extension AS ext, count(f) AS count
        ORDER BY count DESC
      `);
      
      const filesByType: Record<string, number> = {};
      extResult.records.forEach(r => {
        filesByType[r.get('ext')] = r.get('count').toNumber();
      });

      // Import graph (top connections)
      const importResult = await session.run(`
        MATCH (a:File)-[:IMPORTS]->(b:File)
        RETURN a.name AS from, b.name AS to
        LIMIT 50
      `);
      
      const importGraph = importResult.records.map(r => ({
        from: r.get('from'),
        to: r.get('to')
      }));

      return {
        totalNodes: counts.get('files').toNumber(),
        totalRelationships: counts.get('imports').toNumber() + counts.get('dirRels').toNumber(),
        filesByType,
        importGraph
      };
      
    } finally {
      await session.close();
    }
  }

  /**
   * Søg i grafen med Cypher
   */
  async query(cypher: string, params: Record<string, any> = {}): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(r => r.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Find relaterede filer (imports, same directory, etc.)
   */
  async findRelated(filePath: string): Promise<{ imports: string[]; importedBy: string[]; sameDir: string[] }> {
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        MATCH (f:File {path: $path})
        OPTIONAL MATCH (f)-[:IMPORTS]->(imported:File)
        OPTIONAL MATCH (importer:File)-[:IMPORTS]->(f)
        OPTIONAL MATCH (f)-[:IN_DIRECTORY]->(d:Directory)<-[:IN_DIRECTORY]-(sibling:File)
        WHERE sibling <> f
        RETURN 
          collect(DISTINCT imported.path) AS imports,
          collect(DISTINCT importer.path) AS importedBy,
          collect(DISTINCT sibling.path)[0..10] AS sameDir
      `, { path: filePath });

      const record = result.records[0];
      return {
        imports: record.get('imports').filter(Boolean),
        importedBy: record.get('importedBy').filter(Boolean),
        sameDir: record.get('sameDir').filter(Boolean)
      };
      
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
