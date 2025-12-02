import fs from 'fs/promises';
import path from 'path';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  children?: FileNode[];
  lastModified: Date;
}

export class OmniHarvester {
  private ignorePatterns = [
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'build',
    'coverage',
    '.DS_Store',
    'Thumbs.db'
  ];

  constructor(private rootPath: string = process.cwd()) {}

  async scan(dirPath: string = this.rootPath): Promise<FileNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        if (this.ignorePatterns.includes(entry.name)) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootPath, fullPath);
        
        if (entry.isDirectory()) {
          const children = await this.scan(fullPath);
          // Only include directories that have content or are significant
          nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'directory',
            size: 0, // Directories don't really have size
            children,
            lastModified: new Date() // Placeholder, getting stats is expensive for every dir
          });
        } else {
          const stats = await fs.stat(fullPath);
          nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }

      return nodes;
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      return [];
    }
  }

  async harvestFileContent(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.rootPath, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }
}