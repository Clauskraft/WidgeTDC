$Content = @"
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_ROOT = path.resolve(__dirname, '../../../../');
const IGNORE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];

async function weaveGraph() {
  console.log('🕷️ The Synaptic Weaver: Initializing...');
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    console.error('❌ FEJL: Mangler Neo4j credentials i .env');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    await driver.verifyConnectivity();
    console.log('✅ Cloud Cortex Connected.');
    const files = findAllFiles(SYSTEM_ROOT, '.ts');
    console.log('📦 Found ' + files.length + ' .ts files.');

    let relationsCreated = 0;
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = extractImports(content);
      if (imports.length === 0) continue;
      const sourceNodeId = filePath;

      for (const importPath of imports) {
        const resolvedPath = resolveImportPath(filePath, importPath);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            await session.run(`
                MATCH (a:File {path: $source})
                MATCH (b:File {path: $target})
                MERGE (a)-[r:DEPENDS_ON]->(b)
                SET r.type = 'static_import'
            `, { source: sourceNodeId, target: resolvedPath });
            relationsCreated++;
            if (relationsCreated % 10 === 0) process.stdout.write('.');
        }
      }
    }
    console.log('\n🕸️  Weaving Complete! Created ' + relationsCreated + ' new synaptic connections.');
  } catch (error) {
    console.error('💥 Critical Weaver Failure:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

function findAllFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (IGNORE_DIRS.includes(file)) return;
    if (stat.isDirectory()) {
      findAllFiles(filePath, ext, fileList);
    } else {
      if (path.extname(file) === ext) fileList.push(filePath);
    }
  });
  return fileList;
}

function extractImports(content) {
  const regex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  const paths = [];
  let match;
  while ((match = regex.exec(content)) !== null) paths.push(match[1]);
  return paths;
}

function resolveImportPath(currentFile, importPath) {
  if (importPath.startsWith('.')) {
    const dir = path.dirname(currentFile);
    let resolved = path.resolve(dir, importPath);
    if (!resolved.endsWith('.ts') && fs.existsSync(resolved + '.ts')) return resolved + '.ts';
    if (fs.existsSync(path.join(resolved, 'index.ts'))) return path.join(resolved, 'index.ts');
    return fs.existsSync(resolved) ? resolved : null;
  }
  return null;
}

weaveGraph();
"@

Set-Content -Path "apps/backend/src/scripts/weave_graph.ts" -Value $Content -Encoding UTF8
Write-Host "✅ The Synaptic Weaver has been force-updated." -ForegroundColor Green
