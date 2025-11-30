/**
 * 🦖 OMNI-HARVESTER V2: CONTEXT-AWARE INGESTION ENGINE 🦖
 * 
 * "Data Carries Its Own Identity"
 * 
 * Architecture:
 * - Strategy Pattern: Different parsers for different data types
 * - Deterministic IDs: MD5(Content + FilePath)
 * - Idempotency: MERGE-only, never CREATE
 * - Provenance: Every node tracks sourceFile + ingestedAt
 * 
 * Data Strategies:
 * 1. SOURCE_CODE: /src/, /apps/ → CodeFile nodes + IMPORTS relationships
 * 2. DARK_DATA: /harvested/leaks/, /dark_data/ → LeakSource + Identity + EXPOSED_IN
 * 3. SUPER_INTELLIGENCE: /super_intelligence/, /system_prompts/ → Persona + Rule nodes
 * 4. DOCUMENTS: /docs/, /knowledge/ → Document + Chunk nodes for RAG
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import neo4j, { Driver, Session } from 'neo4j-driver';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface FileNode {
  path: string;
  name: string;
  extension: string;
  content: string;
  hash: string;
  lines: number;
  size: number;
}

export interface HarvestResult {
  status: string;
  fileCount: number;
  totalLines: number;
  totalBytes: number;
  byExtension: Record<string, number>;
  duration: number;
  graphStats: GraphIngestionStats;
  files: Array<{ name: string; path: string; lines: number; strategy: DataStrategy }>;
}

export interface GraphIngestionStats {
  nodesCreated: number;
  nodesUpdated: number;
  relationshipsCreated: number;
  leakSourcesFound: number;
  identitiesExtracted: number;
  codeFilesIndexed: number;
  personasDiscovered: number;
  chunksGenerated: number;
}

export type DataStrategy = 'SOURCE_CODE' | 'DARK_DATA' | 'SUPER_INTELLIGENCE' | 'DOCUMENTS' | 'GENERIC';

// ============================================
// REGEX PATTERNS FOR DATA EXTRACTION
// ============================================

const PATTERNS = {
  // Email extraction (RFC 5322 simplified)
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // Password patterns (common leak formats)
  CREDENTIAL_LINE: /^([^:]+):(.+)$/gm, // email:password format
  
  // Hash patterns
  MD5_HASH: /\b[a-f0-9]{32}\b/gi,
  SHA1_HASH: /\b[a-f0-9]{40}\b/gi,
  SHA256_HASH: /\b[a-f0-9]{64}\b/gi,
  BCRYPT_HASH: /\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}/g,
  
  // IP addresses
  IPV4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  
  // Import statements (JS/TS)
  IMPORT_STATEMENT: /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*)?)+\s+from\s+['"]([^'"]+)['"]/g,
  
  // Markdown headers for chunking
  MARKDOWN_HEADER: /^(#{1,6})\s+(.+)$/gm,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateDeterministicId(content: string, filePath: string): string {
  return crypto.createHash('md5').update(content + filePath).digest('hex');
}

function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

function extractEmails(content: string): string[] {
  const matches = content.match(PATTERNS.EMAIL) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))];
}

function extractCredentials(content: string): Array<{ email: string; password: string; hash?: string }> {
  const credentials: Array<{ email: string; password: string; hash?: string }> = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^([^:]+@[^:]+):(.+)$/);
    if (match) {
      const [, email, passwordOrHash] = match;
      const isHash = PATTERNS.MD5_HASH.test(passwordOrHash) || 
                     PATTERNS.SHA1_HASH.test(passwordOrHash) ||
                     PATTERNS.SHA256_HASH.test(passwordOrHash);
      
      credentials.push({
        email: email.toLowerCase().trim(),
        password: isHash ? '' : passwordOrHash.trim(),
        hash: isHash ? passwordOrHash.trim() : undefined
      });
    }
  }
  
  return credentials;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  let match;
  const regex = new RegExp(PATTERNS.IMPORT_STATEMENT.source, 'g');
  
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function chunkByHeaders(content: string, maxChunkSize: number = 2000): Array<{ title: string; content: string }> {
  const chunks: Array<{ title: string; content: string }> = [];
  const lines = content.split('\n');
  
  let currentTitle = 'Introduction';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous chunk
      if (currentContent.length > 0) {
        chunks.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = headerMatch[2];
      currentContent = [];
    } else {
      currentContent.push(line);
      
      // Split if too large
      if (currentContent.join('\n').length > maxChunkSize) {
        chunks.push({ title: currentTitle, content: currentContent.join('\n').trim() });
        currentContent = [];
      }
    }
  }
  
  // Don't forget last chunk
  if (currentContent.length > 0) {
    chunks.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  
  return chunks.filter(c => c.content.length > 50); // Skip tiny chunks
}

function determineStrategy(filePath: string): DataStrategy {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

  // DARK DATA: Leaked credentials, breaches, harvested data
  if (normalizedPath.includes('/harvested/') ||
      normalizedPath.includes('/leaks/') ||
      normalizedPath.includes('/dark_data/') ||
      normalizedPath.includes('/breaches/') ||
      normalizedPath.includes('/combo/') ||
      normalizedPath.includes('/dumps/')) {
    return 'DARK_DATA';
  }

  // SUPER INTELLIGENCE: AI system prompts, personas, leaked models
  if (normalizedPath.includes('/super_intelligence/') ||
      normalizedPath.includes('/system_prompts/') ||
      normalizedPath.includes('/personas/') ||
      normalizedPath.includes('/agents/') ||
      normalizedPath.includes('/intel/') ||        // D:/Intel mount
      normalizedPath.includes('/leaked_x/') ||     // Leaked AI prompts
      normalizedPath.includes('/gpts/') ||         // GPT personas
      normalizedPath.includes('/anthropic/') ||    // Claude prompts
      normalizedPath.includes('/openai/') ||       // OpenAI prompts
      normalizedPath.includes('/google/') ||       // Gemini prompts
      normalizedPath.includes('/xai/')) {          // Grok prompts
    return 'SUPER_INTELLIGENCE';
  }

  // DOCUMENTS: Knowledge base, documentation for RAG
  if (normalizedPath.includes('/docs/') ||
      normalizedPath.includes('/knowledge/') ||
      normalizedPath.includes('/vidensarkiv/') ||
      normalizedPath.includes('/documentation/')) {
    return 'DOCUMENTS';
  }

  // SOURCE CODE: Application code
  if (normalizedPath.includes('/src/') ||
      normalizedPath.includes('/apps/') ||
      normalizedPath.includes('/lib/') ||
      normalizedPath.includes('/components/') ||
      normalizedPath.includes('/packages/')) {
    return 'SOURCE_CODE';
  }

  return 'GENERIC';
}


// ============================================
// MAIN CLASS: OMNI-HARVESTER V2
// ============================================

// ============================================
// GLOBAL ABORT CONTROLLER
// ============================================
let globalAbortController: AbortController | null = null;
let isHarvestRunning = false;
let currentHarvestId: string | null = null;

export function abortHarvest(): { success: boolean; message: string } {
  if (!isHarvestRunning || !globalAbortController) {
    return { success: false, message: 'No harvest operation in progress' };
  }

  console.log('🛑 NØDSTOP ACTIVATED - Aborting harvest operation...');
  globalAbortController.abort();
  return { success: true, message: `Harvest ${currentHarvestId} aborted` };
}

export function getHarvestStatus(): {
  isRunning: boolean;
  harvestId: string | null;
  canAbort: boolean;
} {
  return {
    isRunning: isHarvestRunning,
    harvestId: currentHarvestId,
    canAbort: isHarvestRunning && globalAbortController !== null
  };
}

export class OmniHarvester {
  private rootPath: string;
  private driver: Driver;
  private stats: GraphIngestionStats;
  private abortController: AbortController | null = null;
  private harvestId: string;

  private ignorePatterns: string[] = [
    'node_modules', '.git', 'dist', 'build', '.env',
    'package-lock.json', '.cache', '__pycache__',
    '.next', 'coverage', '.vscode', '.idea', '.turbo'
  ];

  private harvestableExtensions: string[] = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.py',
    '.go', '.yaml', '.yml', '.sql', '.sh', '.bat',
    '.css', '.scss', '.html', '.vue', '.svelte',
    '.txt', '.csv', '.log' // Added for leak data
  ];

  constructor(rootPath: string, neo4jConfig?: { uri: string; user: string; password: string }) {
    this.harvestId = `harvest-${Date.now()}`;
    this.rootPath = rootPath;
    
    const uri = neo4jConfig?.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = neo4jConfig?.user || process.env.NEO4J_USER || 'neo4j';
    const password = neo4jConfig?.password || process.env.NEO4J_PASSWORD || 'password';
    
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    this.stats = {
      nodesCreated: 0,
      nodesUpdated: 0,
      relationshipsCreated: 0,
      leakSourcesFound: 0,
      identitiesExtracted: 0,
      codeFilesIndexed: 0,
      personasDiscovered: 0,
      chunksGenerated: 0
    };
    
    console.log(`🦖 OMNI-HARVESTER V2 initialized`);
    console.log(`   📂 Root: ${rootPath}`);
    console.log(`   🔗 Neo4j: ${uri}`);
  }

  // ============================================
  // RECURSIVE FILE SCANNER
  // ============================================
  
  public async scan(dir: string = this.rootPath): Promise<FileNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let files: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (this.ignorePatterns.some(pattern => fullPath.includes(pattern))) continue;

      if (entry.isDirectory()) {
        const subFiles = await this.scan(fullPath);
        files = [...files, ...subFiles];
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (!this.harvestableExtensions.includes(ext)) continue;
        
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (this.isBinary(content)) continue;

          files.push({
            path: fullPath,
            name: entry.name,
            extension: ext,
            content: content,
            hash: generateContentHash(content),
            lines: content.split('\n').length,
            size: Buffer.byteLength(content, 'utf-8')
          });
        } catch (err) {
          console.warn(`[Harvester] Could not read: ${fullPath}`);
        }
      }
    }
    return files;
  }

  private isBinary(buffer: string): boolean {
    return buffer.includes('\0');
  }

  // ============================================
  // CHECK IF ABORTED
  // ============================================

  private isAborted(): boolean {
    return this.abortController?.signal?.aborted || false;
  }

  // ============================================
  // MAIN HARVEST METHOD
  // ============================================

  public async harvest(): Promise<HarvestResult> {
    // Set up abort controller
    this.abortController = new AbortController();
    globalAbortController = this.abortController;
    isHarvestRunning = true;
    currentHarvestId = this.harvestId;

    console.log(`\n🦖 ═══════════════════════════════════════════════════`);
    console.log(`🦖 OMNI-HARVESTER V2: INITIATING CONTEXT-AWARE SCAN`);
    console.log(`🦖 Harvest ID: ${this.harvestId}`);
    console.log(`🦖 ═══════════════════════════════════════════════════\n`);

    const startTime = Date.now();

    try {
      const files = await this.scan();

      if (this.isAborted()) {
        throw new Error('NØDSTOP: Harvest aborted during scan');
      }

      console.log(`📂 Found ${files.length} files to process\n`);

      // Process each file with its strategy
      const processedFiles: Array<{ name: string; path: string; lines: number; strategy: DataStrategy }> = [];
      let processedCount = 0;

      for (const file of files) {
        // Check abort signal before each file
        if (this.isAborted()) {
          console.log(`🛑 NØDSTOP: Aborting after ${processedCount}/${files.length} files`);
          throw new Error(`NØDSTOP: Harvest aborted after processing ${processedCount} files`);
        }

        const strategy = determineStrategy(file.path);

        try {
          await this.processFile(file, strategy);
          processedFiles.push({
            name: file.name,
            path: file.path.replace(this.rootPath, ''),
            lines: file.lines,
            strategy
          });
          processedCount++;

          // Progress log every 100 files
          if (processedCount % 100 === 0) {
            console.log(`📊 Progress: ${processedCount}/${files.length} files processed`);
          }
        } catch (err: any) {
          if (err.message?.includes('NØDSTOP')) {
            throw err; // Re-throw abort errors
          }
          console.error(`❌ Failed to process ${file.name}:`, err);
        }
      }

      // Calculate stats
      const byExtension: Record<string, number> = {};
      let totalLines = 0;
      let totalBytes = 0;

      for (const file of files) {
        totalLines += file.lines;
        totalBytes += file.size;
        byExtension[file.extension] = (byExtension[file.extension] || 0) + 1;
      }

      const duration = Date.now() - startTime;

      console.log(`\n🦖 ═══════════════════════════════════════════════════`);
      console.log(`✅ HARVEST COMPLETE in ${duration}ms`);
      console.log(`   📄 Files: ${files.length}`);
      console.log(`   📊 Nodes Created: ${this.stats.nodesCreated}`);
      console.log(`   🔄 Nodes Updated: ${this.stats.nodesUpdated}`);
      console.log(`   🔗 Relationships: ${this.stats.relationshipsCreated}`);
      console.log(`   🎭 Identities: ${this.stats.identitiesExtracted}`);
      console.log(`   💀 Leak Sources: ${this.stats.leakSourcesFound}`);
      console.log(`   🧬 Code Files: ${this.stats.codeFilesIndexed}`);
      console.log(`   🤖 Personas: ${this.stats.personasDiscovered}`);
      console.log(`🦖 ═══════════════════════════════════════════════════\n`);

      return {
        status: 'Harvest Complete',
        fileCount: files.length,
        totalLines,
        totalBytes,
        byExtension,
        duration,
        graphStats: { ...this.stats },
        files: processedFiles
      };
    } finally {
      // Clean up global state
      isHarvestRunning = false;
      globalAbortController = null;
      currentHarvestId = null;
    }
  }


  // ============================================
  // STRATEGY ROUTER
  // ============================================

  private async processFile(file: FileNode, strategy: DataStrategy): Promise<void> {
    const session = this.driver.session();
    
    try {
      switch (strategy) {
        case 'DARK_DATA':
          await this.processDarkData(session, file);
          break;
        case 'SUPER_INTELLIGENCE':
          await this.processSuperIntelligence(session, file);
          break;
        case 'DOCUMENTS':
          await this.processDocument(session, file);
          break;
        case 'SOURCE_CODE':
          await this.processSourceCode(session, file);
          break;
        default:
          await this.processGeneric(session, file);
      }
    } finally {
      await session.close();
    }
  }

  // ============================================
  // STRATEGY: DARK DATA (Leaks/Breaches)
  // ============================================

  private async processDarkData(session: Session, file: FileNode): Promise<void> {
    console.log(`💀 [DARK_DATA] Processing: ${file.name}`);
    
    const fileId = generateDeterministicId(file.content, file.path);
    
    // Create LeakSource node
    await session.run(`
      MERGE (source:LeakSource {id: $id})
      ON CREATE SET 
        source.filename = $filename,
        source.path = $path,
        source.hash = $hash,
        source.size = $size,
        source.lines = $lines,
        source.ingestedAt = datetime(),
        source.createdAt = datetime()
      ON MATCH SET
        source.hash = $hash,
        source.size = $size,
        source.lines = $lines,
        source.updatedAt = datetime()
    `, {
      id: fileId,
      filename: file.name,
      path: file.path,
      hash: file.hash,
      size: file.size,
      lines: file.lines
    });
    this.stats.leakSourcesFound++;
    this.stats.nodesCreated++;
    
    // Extract credentials
    const credentials = extractCredentials(file.content);
    const emails = extractEmails(file.content);
    
    // Merge all unique emails
    const allEmails = new Set([
      ...credentials.map(c => c.email),
      ...emails
    ]);
    
    for (const email of allEmails) {
      if (!email || email.length < 5) continue;
      
      const emailId = generateDeterministicId(email, 'identity');
      
      // Create Identity node
      const result = await session.run(`
        MERGE (i:Identity {id: $id})
        ON CREATE SET 
          i.email = $email,
          i.domain = $domain,
          i.ingestedAt = datetime(),
          i.exposureCount = 1
        ON MATCH SET
          i.exposureCount = i.exposureCount + 1,
          i.lastSeenAt = datetime()
        
        WITH i
        MATCH (source:LeakSource {id: $sourceId})
        MERGE (i)-[r:EXPOSED_IN]->(source)
        ON CREATE SET r.discoveredAt = datetime()
        
        RETURN i.exposureCount AS count
      `, {
        id: emailId,
        email: email,
        domain: email.split('@')[1] || 'unknown',
        sourceId: fileId
      });
      
      this.stats.identitiesExtracted++;
      this.stats.relationshipsCreated++;
    }
    
    // Store credentials with hashes
    for (const cred of credentials) {
      if (cred.hash) {
        const hashId = generateDeterministicId(cred.hash, 'hash');
        
        await session.run(`
          MERGE (h:Hash {id: $id})
          ON CREATE SET 
            h.value = $hash,
            h.type = $hashType,
            h.ingestedAt = datetime()
          
          WITH h
          MATCH (i:Identity {email: $email})
          MERGE (i)-[r:HAS_HASH]->(h)
          ON CREATE SET r.sourceFile = $sourceFile
        `, {
          id: hashId,
          hash: cred.hash,
          hashType: this.detectHashType(cred.hash),
          email: cred.email,
          sourceFile: file.name
        });
        
        this.stats.nodesCreated++;
        this.stats.relationshipsCreated++;
      }
    }
    
    console.log(`   ✓ Found ${allEmails.size} emails, ${credentials.length} credentials`);
  }

  private detectHashType(hash: string): string {
    if (hash.length === 32) return 'MD5';
    if (hash.length === 40) return 'SHA1';
    if (hash.length === 64) return 'SHA256';
    if (hash.startsWith('$2')) return 'BCRYPT';
    return 'UNKNOWN';
  }


  // ============================================
  // STRATEGY: SUPER INTELLIGENCE (Prompts/Personas)
  // ============================================

  private async processSuperIntelligence(session: Session, file: FileNode): Promise<void> {
    console.log(`🤖 [SUPER_INTELLIGENCE] Processing: ${file.name}`);
    
    const personaName = path.basename(file.name, file.extension);
    const personaId = generateDeterministicId(personaName, 'persona');
    
    // Create Persona node
    await session.run(`
      MERGE (p:Persona {id: $id})
      ON CREATE SET 
        p.name = $name,
        p.sourceFile = $sourceFile,
        p.path = $path,
        p.ingestedAt = datetime()
      ON MATCH SET
        p.updatedAt = datetime()
    `, {
      id: personaId,
      name: personaName,
      sourceFile: file.name,
      path: file.path
    });
    this.stats.personasDiscovered++;
    this.stats.nodesCreated++;
    
    // Chunk by headers and create Rule nodes
    const chunks = chunkByHeaders(file.content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const ruleId = generateDeterministicId(chunk.content, file.path + i);
      
      await session.run(`
        MERGE (r:Rule {id: $id})
        ON CREATE SET 
          r.title = $title,
          r.content = $content,
          r.order = $order,
          r.sourceFile = $sourceFile,
          r.ingestedAt = datetime()
        
        WITH r
        MATCH (p:Persona {id: $personaId})
        MERGE (p)-[rel:HAS_RULE]->(r)
        ON CREATE SET rel.order = $order
      `, {
        id: ruleId,
        title: chunk.title,
        content: chunk.content.substring(0, 10000),
        order: i,
        sourceFile: file.name,
        personaId: personaId
      });
      
      this.stats.nodesCreated++;
      this.stats.relationshipsCreated++;
    }
    
    console.log(`   ✓ Created persona "${personaName}" with ${chunks.length} rules`);
  }

  // ============================================
  // STRATEGY: DOCUMENTS (RAG Chunks)
  // ============================================

  private async processDocument(session: Session, file: FileNode): Promise<void> {
    console.log(`📚 [DOCUMENTS] Processing: ${file.name}`);
    
    const docId = generateDeterministicId(file.content, file.path);
    
    // Create Document node
    await session.run(`
      MERGE (d:Document {id: $id})
      ON CREATE SET 
        d.name = $name,
        d.path = $path,
        d.extension = $extension,
        d.hash = $hash,
        d.lines = $lines,
        d.ingestedAt = datetime()
      ON MATCH SET
        d.hash = $hash,
        d.lines = $lines,
        d.updatedAt = datetime()
    `, {
      id: docId,
      name: file.name,
      path: file.path,
      extension: file.extension,
      hash: file.hash,
      lines: file.lines
    });
    this.stats.nodesCreated++;
    
    // Create chunks for RAG
    const chunks = chunkByHeaders(file.content, 1500);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = generateDeterministicId(chunk.content, file.path + '-chunk-' + i);
      
      await session.run(`
        MERGE (c:Chunk {id: $id})
        ON CREATE SET 
          c.title = $title,
          c.content = $content,
          c.order = $order,
          c.sourceDocument = $sourceDoc,
          c.ingestedAt = datetime()
        
        WITH c
        MATCH (d:Document {id: $docId})
        MERGE (c)-[r:CHUNK_OF]->(d)
        ON CREATE SET r.order = $order
      `, {
        id: chunkId,
        title: chunk.title,
        content: chunk.content.substring(0, 8000),
        order: i,
        sourceDoc: file.name,
        docId: docId
      });
      
      this.stats.chunksGenerated++;
      this.stats.relationshipsCreated++;
    }
    
    console.log(`   ✓ Created document with ${chunks.length} chunks`);
  }


  // ============================================
  // STRATEGY: SOURCE CODE
  // ============================================

  private async processSourceCode(session: Session, file: FileNode): Promise<void> {
    console.log(`🧬 [SOURCE_CODE] Processing: ${file.name}`);
    
    const fileId = generateDeterministicId(file.content, file.path);
    
    // Create CodeFile node
    await session.run(`
      MERGE (f:CodeFile {id: $id})
      ON CREATE SET 
        f.name = $name,
        f.path = $path,
        f.extension = $extension,
        f.hash = $hash,
        f.lines = $lines,
        f.size = $size,
        f.ingestedAt = datetime()
      ON MATCH SET
        f.hash = $hash,
        f.lines = $lines,
        f.size = $size,
        f.updatedAt = datetime()
    `, {
      id: fileId,
      name: file.name,
      path: file.path,
      extension: file.extension,
      hash: file.hash,
      lines: file.lines,
      size: file.size
    });
    this.stats.codeFilesIndexed++;
    this.stats.nodesCreated++;
    
    // Extract and create import relationships
    if (['.ts', '.tsx', '.js', '.jsx'].includes(file.extension)) {
      const imports = extractImports(file.content);
      
      for (const importPath of imports) {
        // Create or match Module node
        const moduleName = importPath.startsWith('.') 
          ? path.basename(importPath) 
          : importPath.split('/')[0];
        
        await session.run(`
          MERGE (m:Module {name: $moduleName})
          ON CREATE SET m.importPath = $importPath, m.ingestedAt = datetime()
          
          WITH m
          MATCH (f:CodeFile {id: $fileId})
          MERGE (f)-[r:IMPORTS]->(m)
          ON CREATE SET r.importPath = $importPath
        `, {
          moduleName: moduleName,
          importPath: importPath,
          fileId: fileId
        });
        
        this.stats.relationshipsCreated++;
      }
      
      console.log(`   ✓ Indexed with ${imports.length} imports`);
    }
    
    // Create directory hierarchy
    const dirPath = path.dirname(file.path);
    await session.run(`
      MERGE (d:Directory {path: $dirPath})
      ON CREATE SET d.name = $dirName, d.ingestedAt = datetime()
      
      WITH d
      MATCH (f:CodeFile {id: $fileId})
      MERGE (f)-[:IN_DIRECTORY]->(d)
    `, {
      dirPath: dirPath,
      dirName: path.basename(dirPath),
      fileId: fileId
    });
    this.stats.relationshipsCreated++;
  }

  // ============================================
  // STRATEGY: GENERIC (Fallback)
  // ============================================

  private async processGeneric(session: Session, file: FileNode): Promise<void> {
    console.log(`📄 [GENERIC] Processing: ${file.name}`);
    
    const fileId = generateDeterministicId(file.content, file.path);
    
    await session.run(`
      MERGE (f:File {id: $id})
      ON CREATE SET 
        f.name = $name,
        f.path = $path,
        f.extension = $extension,
        f.hash = $hash,
        f.lines = $lines,
        f.size = $size,
        f.ingestedAt = datetime()
      ON MATCH SET
        f.hash = $hash,
        f.lines = $lines,
        f.size = $size,
        f.updatedAt = datetime()
    `, {
      id: fileId,
      name: file.name,
      path: file.path,
      extension: file.extension,
      hash: file.hash,
      lines: file.lines,
      size: file.size
    });
    this.stats.nodesCreated++;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  public async getStats(): Promise<{
    nodes: Record<string, number>;
    relationships: Record<string, number>;
  }> {
    const session = this.driver.session();
    
    try {
      const nodeResult = await session.run(`
        CALL db.labels() YIELD label
        CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {}) YIELD value
        RETURN label, value.count as count
      `);
      
      const relResult = await session.run(`
        CALL db.relationshipTypes() YIELD relationshipType
        CALL apoc.cypher.run('MATCH ()-[r:' + relationshipType + ']->() RETURN count(r) as count', {}) YIELD value
        RETURN relationshipType, value.count as count
      `);
      
      const nodes: Record<string, number> = {};
      const relationships: Record<string, number> = {};
      
      nodeResult.records.forEach(r => {
        nodes[r.get('label')] = r.get('count').toNumber();
      });
      
      relResult.records.forEach(r => {
        relationships[r.get('relationshipType')] = r.get('count').toNumber();
      });
      
      return { nodes, relationships };
    } catch {
      // Fallback without APOC
      const result = await session.run(`
        MATCH (n) 
        RETURN labels(n)[0] AS label, count(*) AS count
        UNION ALL
        MATCH ()-[r]->()
        RETURN type(r) AS label, count(*) AS count
      `);
      
      const stats: Record<string, number> = {};
      result.records.forEach(r => {
        stats[r.get('label')] = (r.get('count') as any).toNumber?.() || r.get('count');
      });
      
      return { nodes: stats, relationships: {} };
    } finally {
      await session.close();
    }
  }

  public async close(): Promise<void> {
    await this.driver.close();
    console.log('🦖 OmniHarvester connection closed');
  }

  // ============================================
  // GET FILES WITH CONTENT (for KnowledgeGraph)
  // ============================================

  public async getFilesWithContent(): Promise<Array<{
    path: string;
    name: string;
    content: string;
    extension: string;
    lines: number;
    hash: string;
  }>> {
    const files = await this.scan();
    return files.map(f => ({
      path: f.path,
      name: f.name,
      content: f.content,
      extension: f.extension,
      lines: f.lines,
      hash: f.hash
    }));
  }

  // ============================================
  // TARGETED HARVEST (specific paths only)
  // ============================================

  public async harvestPath(targetPath: string): Promise<HarvestResult> {
    console.log(`\n🦖 TARGETED HARVEST: ${targetPath}`);
    const originalRoot = this.rootPath;
    this.rootPath = targetPath;

    try {
      return await this.harvest();
    } finally {
      this.rootPath = originalRoot;
    }
  }

  // ============================================
  // GET HARVEST SUMMARY (without full content)
  // ============================================

  public async getSummary(): Promise<{
    totalFiles: number;
    byStrategy: Record<DataStrategy, number>;
    byExtension: Record<string, number>;
  }> {
    const files = await this.scan();

    const byStrategy: Record<DataStrategy, number> = {
      SOURCE_CODE: 0,
      DARK_DATA: 0,
      SUPER_INTELLIGENCE: 0,
      DOCUMENTS: 0,
      GENERIC: 0
    };

    const byExtension: Record<string, number> = {};

    for (const file of files) {
      const strategy = determineStrategy(file.path);
      byStrategy[strategy]++;
      byExtension[file.extension] = (byExtension[file.extension] || 0) + 1;
    }

    return {
      totalFiles: files.length,
      byStrategy,
      byExtension
    };
  }
}

export default OmniHarvester;
