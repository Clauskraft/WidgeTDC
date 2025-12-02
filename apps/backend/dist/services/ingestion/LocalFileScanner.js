// LocalFileScanner – Scans local file system for documents and data
import { promises as fs } from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
export class LocalFileScanner {
    constructor(config) {
        this.name = 'Local File Scanner';
        this.type = 'local_files';
        this.config = {
            maxDepth: 3,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            extensions: ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.csv', '.json'],
            excludePatterns: ['node_modules', '.git', 'dist', 'build'],
            ...config
        };
    }
    async isAvailable() {
        // Check if at least one root path exists
        for (const rootPath of this.config.rootPaths) {
            try {
                await fs.access(rootPath);
                return true;
            }
            catch {
                continue;
            }
        }
        return false;
    }
    async fetch() {
        const files = [];
        for (const rootPath of this.config.rootPaths) {
            try {
                await this.walkDirectory(rootPath, 0, files);
            }
            catch (error) {
                console.warn(`Failed to scan ${rootPath}:`, error.message);
            }
        }
        return files;
    }
    async walkDirectory(dirPath, depth, results) {
        if (this.config.maxDepth && depth > this.config.maxDepth) {
            return;
        }
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                // Check exclusion patterns
                if (this.shouldExclude(fullPath)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    await this.walkDirectory(fullPath, depth + 1, results);
                }
                else if (entry.isFile()) {
                    // Check extension
                    if (this.config.extensions && this.config.extensions.length > 0) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (!this.config.extensions.includes(ext)) {
                            continue;
                        }
                    }
                    // Check file size
                    const stat = await fs.stat(fullPath);
                    if (this.config.maxFileSize && stat.size > this.config.maxFileSize) {
                        console.warn(`Skipping large file: ${fullPath} (${stat.size} bytes)`);
                        continue;
                    }
                    results.push({
                        path: fullPath,
                        name: entry.name,
                        size: stat.size,
                        modifiedAt: stat.mtime,
                        extension: path.extname(entry.name).toLowerCase()
                    });
                }
            }
        }
        catch (error) {
            console.warn(`Failed to read directory ${dirPath}:`, error.message);
        }
    }
    shouldExclude(filePath) {
        if (!this.config.excludePatterns)
            return false;
        return this.config.excludePatterns.some(pattern => filePath.includes(pattern));
    }
    async transform(files) {
        const entities = [];
        for (const file of files) {
            try {
                // For text files, read content
                let content = '';
                if (['.txt', '.md', '.json', '.csv'].includes(file.extension)) {
                    try {
                        content = await fs.readFile(file.path, 'utf-8');
                    }
                    catch {
                        content = '(unable to read)';
                    }
                }
                else if (file.extension === '.pdf') {
                    try {
                        const dataBuffer = await fs.readFile(file.path);
                        // Cast to any to bypass type definition issues with pdf-parse import
                        const data = await pdf(dataBuffer);
                        content = data.text;
                    }
                    catch (e) {
                        console.warn(`Failed to parse PDF ${file.path}:`, e);
                        content = '(unable to read pdf)';
                    }
                }
                // Truncate if too long (except for PDFs where we might want more context, but keeping safety limit)
                if (content.length > 50000) {
                    content = content.substring(0, 50000) + '... (truncated)';
                }
                entities.push({
                    id: file.path,
                    type: 'local_file',
                    source: 'Local File Scanner',
                    title: file.name,
                    content,
                    metadata: {
                        path: file.path,
                        size: file.size,
                        extension: file.extension,
                        modifiedAt: file.modifiedAt,
                    },
                    timestamp: new Date()
                });
            }
            catch (error) {
                console.warn(`Failed to transform file ${file.path}:`, error.message);
            }
        }
        return entities;
    }
}
