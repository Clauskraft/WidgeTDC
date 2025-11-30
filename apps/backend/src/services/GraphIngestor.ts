/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    GRAPH INGESTOR - KNOWLEDGE HARVESTER                   ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Converts filesystem structure to Neo4j knowledge graph                   ║
 * ║                                                                           ║
 * ║  Structure:                                                               ║
 * ║  (:Repository)-[:CONTAINS]->(:Directory)-[:CONTAINS]->(:File)             ║
 * ║                                                                           ║
 * ║  Delivered by: Gemini (The Architect)                                     ║
 * ║  Implemented by: Claude (The Captain)                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { neo4jAdapter } from '../adapters/Neo4jAdapter.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface IngestOptions {
    rootPath: string;
    repositoryName?: string;
    includePatterns?: string[];
    excludePatterns?: string[];
    maxDepth?: number;
    parseContent?: boolean;
}

export interface IngestResult {
    success: boolean;
    repositoryId: string;
    stats: {
        directoriesCreated: number;
        filesCreated: number;
        relationshipsCreated: number;
        totalNodes: number;
        duration: number;
    };
    errors: string[];
}

interface FileInfo {
    name: string;
    path: string;
    relativePath: string;
    extension: string;
    language: string;
    size: number;
    lines?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Language Detection
// ═══════════════════════════════════════════════════════════════════════════

const LANGUAGE_MAP: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript/React',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript/React',
    '.md': 'Markdown',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.html': 'HTML',
    '.sql': 'SQL',
    '.py': 'Python',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.ps1': 'PowerShell',
    '.dockerfile': 'Dockerfile',
    '.env': 'Environment',
    '.gitignore': 'Git',
};

const DEFAULT_EXCLUDE = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '.cache',
    '__pycache__',
    '.vscode',
    '.idea'
];

// ═══════════════════════════════════════════════════════════════════════════
// Graph Ingestor Class
// ═══════════════════════════════════════════════════════════════════════════

export class GraphIngestor {
    private options: Required<IngestOptions>;
    private stats = {
        directoriesCreated: 0,
        filesCreated: 0,
        relationshipsCreated: 0,
        totalNodes: 0,
        duration: 0
    };
    private errors: string[] = [];

    constructor(options: IngestOptions) {
        this.options = {
            rootPath: options.rootPath,
            repositoryName: options.repositoryName || path.basename(options.rootPath),
            includePatterns: options.includePatterns || ['*'],
            excludePatterns: options.excludePatterns || DEFAULT_EXCLUDE,
            maxDepth: options.maxDepth || 10,
            parseContent: options.parseContent ?? false
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Main Ingestion Method
    // ═══════════════════════════════════════════════════════════════════════

    async ingest(): Promise<IngestResult> {
        const startTime = Date.now();

        try {
            console.log(`[GraphIngestor] 🚀 Starting ingestion of: ${this.options.rootPath}`);

            // Create Repository node
            const repoId = this.generateId('Repository', this.options.repositoryName);
            await this.createRepositoryNode(repoId);

            // Recursively process directory
            await this.processDirectory(this.options.rootPath, repoId, 0);

            this.stats.duration = Date.now() - startTime;
            this.stats.totalNodes = this.stats.directoriesCreated + this.stats.filesCreated + 1;

            console.log(`[GraphIngestor] ✅ Ingestion complete in ${this.stats.duration}ms`);
            console.log(`[GraphIngestor] 📊 Stats: ${this.stats.totalNodes} nodes, ${this.stats.relationshipsCreated} relationships`);

            return {
                success: true,
                repositoryId: repoId,
                stats: this.stats,
                errors: this.errors
            };

        } catch (error: any) {
            this.errors.push(`Fatal error: ${error.message}`);
            return {
                success: false,
                repositoryId: '',
                stats: this.stats,
                errors: this.errors
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Node Creation
    // ═══════════════════════════════════════════════════════════════════════

    private async createRepositoryNode(repoId: string): Promise<void> {
        await neo4jAdapter.writeQuery(`
            MERGE (r:Repository {id: $id})
            SET r.name = $name,
                r.path = $path,
                r.ingestedAt = datetime(),
                r.source = 'graph-ingestor'
            RETURN r
        `, {
            id: repoId,
            name: this.options.repositoryName,
            path: this.options.rootPath
        });

        console.log(`[GraphIngestor] 📦 Created Repository: ${this.options.repositoryName}`);
    }

    private async createDirectoryNode(
        dirPath: string,
        parentId: string,
        depth: number
    ): Promise<string> {
        const dirName = path.basename(dirPath);
        const relativePath = path.relative(this.options.rootPath, dirPath);
        const dirId = this.generateId('Directory', relativePath || dirName);

        await neo4jAdapter.writeQuery(`
            MERGE (d:Directory {id: $id})
            SET d.name = $name,
                d.path = $path,
                d.relativePath = $relativePath,
                d.depth = $depth,
                d.ingestedAt = datetime()
            WITH d
            MATCH (p {id: $parentId})
            MERGE (p)-[:CONTAINS]->(d)
            RETURN d
        `, {
            id: dirId,
            name: dirName,
            path: dirPath,
            relativePath: relativePath || '.',
            depth: depth,
            parentId: parentId
        });

        this.stats.directoriesCreated++;
        this.stats.relationshipsCreated++;

        return dirId;
    }

    private async createFileNode(fileInfo: FileInfo, parentId: string): Promise<void> {
        const fileId = this.generateId('File', fileInfo.relativePath);

        await neo4jAdapter.writeQuery(`
            MERGE (f:File:${this.sanitizeLabel(fileInfo.language)} {id: $id})
            SET f.name = $name,
                f.path = $path,
                f.relativePath = $relativePath,
                f.extension = $extension,
                f.language = $language,
                f.size = $size,
                f.lines = $lines,
                f.ingestedAt = datetime()
            WITH f
            MATCH (p {id: $parentId})
            MERGE (p)-[:CONTAINS]->(f)
            RETURN f
        `, {
            id: fileId,
            name: fileInfo.name,
            path: fileInfo.path,
            relativePath: fileInfo.relativePath,
            extension: fileInfo.extension,
            language: fileInfo.language,
            size: fileInfo.size,
            lines: fileInfo.lines || 0,
            parentId: parentId
        });

        this.stats.filesCreated++;
        this.stats.relationshipsCreated++;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Directory Processing
    // ═══════════════════════════════════════════════════════════════════════

    private async processDirectory(
        dirPath: string,
        parentId: string,
        depth: number
    ): Promise<void> {
        if (depth > this.options.maxDepth) {
            return;
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                // Skip excluded patterns
                if (this.shouldExclude(entry.name)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const dirId = await this.createDirectoryNode(fullPath, parentId, depth);
                    await this.processDirectory(fullPath, dirId, depth + 1);

                } else if (entry.isFile()) {
                    const fileInfo = await this.getFileInfo(fullPath);
                    if (fileInfo) {
                        await this.createFileNode(fileInfo, parentId);
                    }
                }
            }

        } catch (error: any) {
            this.errors.push(`Error processing ${dirPath}: ${error.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    private async getFileInfo(filePath: string): Promise<FileInfo | null> {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const relativePath = path.relative(this.options.rootPath, filePath);

            let lines: number | undefined;
            if (this.isTextFile(ext)) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    lines = content.split('\n').length;
                } catch {
                    // Binary or unreadable file
                }
            }

            return {
                name: path.basename(filePath),
                path: filePath,
                relativePath: relativePath,
                extension: ext,
                language: this.detectLanguage(ext, path.basename(filePath)),
                size: stats.size,
                lines: lines
            };

        } catch (error) {
            return null;
        }
    }

    private detectLanguage(ext: string, filename: string): string {
        // Special cases for files without extensions
        const lowerName = filename.toLowerCase();
        if (lowerName === 'dockerfile') return 'Dockerfile';
        if (lowerName === 'makefile') return 'Makefile';
        if (lowerName.startsWith('.env')) return 'Environment';
        if (lowerName === '.gitignore') return 'Git';

        return LANGUAGE_MAP[ext] || 'Unknown';
    }

    private isTextFile(ext: string): boolean {
        const textExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.json', '.md',
            '.yaml', '.yml', '.css', '.scss', '.html',
            '.sql', '.py', '.sh', '.bat', '.ps1', '.txt',
            '.env', '.gitignore', '.prettierrc', '.eslintrc'
        ];
        return textExtensions.includes(ext);
    }

    private shouldExclude(name: string): boolean {
        return this.options.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }

    private generateId(type: string, identifier: string): string {
        const content = `${type}:${identifier}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }

    private sanitizeLabel(language: string): string {
        // Convert language to valid Neo4j label
        return language
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/^_+|_+$/g, '')
            || 'Unknown';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Factory Function
// ═══════════════════════════════════════════════════════════════════════════

export async function ingestRepository(options: IngestOptions): Promise<IngestResult> {
    const ingestor = new GraphIngestor(options);
    return ingestor.ingest();
}
