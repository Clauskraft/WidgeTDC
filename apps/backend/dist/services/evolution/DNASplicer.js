/**
 * 🧬 DNA SPLICER - Intelligence Pattern Extractor
 *
 * Analyzes leaked System Prompts and Reference Code to extract
 * intelligence patterns for WidgeTDC's Knowledge Graph.
 *
 * Node Types Created:
 * - (:Persona) - AI personalities (Claude, GPT variants, custom GPTs)
 * - (:Directive) - Rules/instructions from system prompts
 * - (:Capability) - Identified capabilities (CodeGeneration, WebBrowsing, etc.)
 * - (:Hotkey) - Interaction patterns
 * - (:Pattern) - Behavioral patterns extracted
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import neo4j from 'neo4j-driver';
// ============================================
// DIRECTIVE PATTERNS (Regex)
// ============================================
const DIRECTIVE_PATTERNS = {
    rule: /(?:you (?:must|should|always|never)|rule:|important:|note:)/i,
    behavior: /(?:when|if|respond|reply|act|behave|personality|tone)/i,
    restriction: /(?:never|don't|do not|cannot|must not|forbidden|under no circumstances)/i,
    capability: /(?:can|able to|capable|support|feature|tool|function)/i,
    tone: /(?:tone|voice|style|manner|personality|character|persona)/i,
    format: /(?:format|structure|output|respond with|use|markdown|code block)/i,
};
// ============================================
// CAPABILITY KEYWORDS
// ============================================
const CAPABILITY_KEYWORDS = [
    { keyword: 'code', capability: 'CodeGeneration' },
    { keyword: 'write code', capability: 'CodeGeneration' },
    { keyword: 'programming', capability: 'CodeGeneration' },
    { keyword: 'file', capability: 'FileOperations' },
    { keyword: 'read file', capability: 'FileReading' },
    { keyword: 'write file', capability: 'FileWriting' },
    { keyword: 'browse', capability: 'WebBrowsing' },
    { keyword: 'search', capability: 'WebSearch' },
    { keyword: 'image', capability: 'ImageGeneration' },
    { keyword: 'dalle', capability: 'ImageGeneration' },
    { keyword: 'python', capability: 'PythonExecution' },
    { keyword: 'jupyter', capability: 'PythonExecution' },
    { keyword: 'analyze', capability: 'DataAnalysis' },
    { keyword: 'math', capability: 'MathematicalReasoning' },
    { keyword: 'reason', capability: 'LogicalReasoning' },
    { keyword: 'step-by-step', capability: 'ChainOfThought' },
    { keyword: 'task', capability: 'TaskManagement' },
    { keyword: 'memory', capability: 'ContextMemory' },
    { keyword: 'remember', capability: 'ContextMemory' },
    { keyword: 'tool', capability: 'ToolUse' },
    { keyword: 'function', capability: 'FunctionCalling' },
    { keyword: 'api', capability: 'APIIntegration' },
    { keyword: 'autonomous', capability: 'AutonomousOperation' },
    { keyword: 'self-heal', capability: 'SelfHealing' },
    { keyword: 'debug', capability: 'Debugging' },
];
// ============================================
// DNA SPLICER CLASS
// ============================================
export class DNASplicer {
    constructor(intelPath = '/intel') {
        const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        this.intelPath = intelPath;
        console.log('🧬 DNA Splicer initialized');
    }
    /**
     * 🔬 PREMIUM SPLICE - Only real model prompts (Claude, GPT, Gemini, Grok)
     */
    async splicePremium() {
        const startTime = Date.now();
        const errors = [];
        let personas = 0;
        let directives = 0;
        let capabilities = 0;
        let hotkeys = 0;
        console.log('🧬 DNA SPLICER [PREMIUM MODE]: Extracting real model system prompts');
        const session = this.driver.session();
        try {
            await this.createIndexes(session);
            // Only scan premium directories
            for (const premiumPath of DNASplicer.PREMIUM_PATHS) {
                const fullPath = path.join(this.intelPath, 'Leaked_x', premiumPath);
                console.log(`📂 Scanning premium path: ${fullPath}`);
                try {
                    const files = await this.findPromptFiles(fullPath);
                    console.log(`   Found ${files.length} files`);
                    for (const filePath of files) {
                        try {
                            const result = await this.processPromptFile(session, filePath, true); // premium flag
                            personas += result.personas;
                            directives += result.directives;
                            capabilities += result.capabilities;
                            hotkeys += result.hotkeys;
                        }
                        catch (err) {
                            errors.push(`Failed: ${path.basename(filePath)}: ${err}`);
                        }
                    }
                }
                catch (err) {
                    console.warn(`⚠️ Could not access ${premiumPath}`);
                }
            }
            await this.createPersonaRelationships(session);
        }
        finally {
            await session.close();
        }
        const duration = Date.now() - startTime;
        console.log(`✅ PREMIUM SPLICE COMPLETE: ${personas} personas, ${directives} directives in ${duration}ms`);
        return { personas, directives, capabilities, hotkeys, duration, errors };
    }
    /**
     * 🔬 MAIN SPLICE OPERATION
     * Scans intel directory and extracts all patterns
     */
    async splice() {
        const startTime = Date.now();
        const errors = [];
        let personas = 0;
        let directives = 0;
        let capabilities = 0;
        let hotkeys = 0;
        console.log(`🧬 DNA SPLICER: Starting intelligence extraction from ${this.intelPath}`);
        try {
            // Find all markdown files (system prompts)
            const promptFiles = await this.findPromptFiles(this.intelPath);
            console.log(`📁 Found ${promptFiles.length} prompt files`);
            const session = this.driver.session();
            try {
                // Create indexes for performance
                await this.createIndexes(session);
                // Process each prompt file
                for (const filePath of promptFiles) {
                    try {
                        const result = await this.processPromptFile(session, filePath);
                        personas += result.personas;
                        directives += result.directives;
                        capabilities += result.capabilities;
                        hotkeys += result.hotkeys;
                    }
                    catch (err) {
                        const error = `Failed to process ${filePath}: ${err}`;
                        console.error(`❌ ${error}`);
                        errors.push(error);
                    }
                }
                // Create inter-persona relationships
                await this.createPersonaRelationships(session);
            }
            finally {
                await session.close();
            }
        }
        catch (err) {
            errors.push(`Splice operation failed: ${err}`);
            console.error('❌ Splice failed:', err);
        }
        const duration = Date.now() - startTime;
        console.log(`✅ DNA SPLICE COMPLETE: ${personas} personas, ${directives} directives, ${capabilities} capabilities in ${duration}ms`);
        return {
            personas,
            directives,
            capabilities,
            hotkeys,
            duration,
            errors,
        };
    }
    /**
     * Recursively find all .md files
     */
    async findPromptFiles(dir) {
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findPromptFiles(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.name.endsWith('.md') || entry.name.endsWith('.txt')) {
                    files.push(fullPath);
                }
            }
        }
        catch (err) {
            console.warn(`⚠️ Could not read directory ${dir}:`, err);
        }
        return files;
    }
    /**
     * Create Neo4j indexes
     */
    async createIndexes(session) {
        const indexes = [
            'CREATE INDEX persona_name IF NOT EXISTS FOR (p:Persona) ON (p.name)',
            'CREATE INDEX directive_type IF NOT EXISTS FOR (d:Directive) ON (d.type)',
            'CREATE INDEX capability_name IF NOT EXISTS FOR (c:Capability) ON (c.name)',
        ];
        for (const idx of indexes) {
            try {
                await session.run(idx);
            }
            catch {
                // Index might already exist
            }
        }
    }
    /**
     * Process a single prompt file
     */
    async processPromptFile(session, filePath, isPremium = false) {
        const content = await fs.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath, path.extname(filePath));
        // Extract metadata from markdown
        const metadata = this.extractMetadata(content, fileName);
        // Extract the actual prompt content (inside code blocks)
        const promptContent = this.extractPromptContent(content);
        if (!promptContent) {
            return { personas: 0, directives: 0, capabilities: 0, hotkeys: 0 };
        }
        // Create Persona node
        const personaHash = crypto.createHash('md5').update(promptContent).digest('hex');
        // Determine vendor from path
        let vendor = 'Unknown';
        if (filePath.includes('/Anthropic/') || filePath.includes('claude'))
            vendor = 'Anthropic';
        else if (filePath.includes('/OpenAI/') || filePath.includes('gpt'))
            vendor = 'OpenAI';
        else if (filePath.includes('/Google/') || filePath.includes('gemini'))
            vendor = 'Google';
        else if (filePath.includes('/xAI/') || filePath.includes('grok'))
            vendor = 'xAI';
        else if (filePath.includes('/Perplexity/'))
            vendor = 'Perplexity';
        else if (filePath.includes('/Misc/'))
            vendor = 'Misc';
        await session.run(`
      MERGE (p:Persona {name: $name})
      ON CREATE SET
        p.source = $source,
        p.sourceUrl = $sourceUrl,
        p.author = $author,
        p.description = $description,
        p.hash = $hash,
        p.rawPrompt = $rawPrompt,
        p.vendor = $vendor,
        p.isPremium = $isPremium,
        p.createdAt = datetime()
      ON MATCH SET
        p.hash = $hash,
        p.rawPrompt = $rawPrompt,
        p.vendor = $vendor,
        p.isPremium = $isPremium,
        p.updatedAt = datetime()
    `, {
            name: metadata.name,
            source: filePath,
            sourceUrl: metadata.url || null,
            author: metadata.author || null,
            description: metadata.description || null,
            hash: personaHash,
            rawPrompt: promptContent.substring(0, 50000),
            vendor,
            isPremium,
        });
        // Extract and create Directives
        const extractedDirectives = this.extractDirectives(promptContent);
        let directiveCount = 0;
        for (const directive of extractedDirectives) {
            await session.run(`
        MATCH (p:Persona {name: $personaName})
        MERGE (d:Directive {id: $id})
        ON CREATE SET
          d.content = $content,
          d.type = $type,
          d.priority = $priority,
          d.createdAt = datetime()
        MERGE (p)-[:HAS_DIRECTIVE]->(d)
      `, {
                personaName: metadata.name,
                id: directive.id,
                content: directive.content,
                type: directive.type,
                priority: directive.priority,
            });
            directiveCount++;
        }
        // Extract and create Capabilities
        const extractedCapabilities = this.extractCapabilities(promptContent);
        let capabilityCount = 0;
        for (const capability of extractedCapabilities) {
            await session.run(`
        MATCH (p:Persona {name: $personaName})
        MERGE (c:Capability {name: $name})
        ON CREATE SET
          c.description = $description,
          c.createdAt = datetime()
        MERGE (p)-[:HAS_CAPABILITY]->(c)
      `, {
                personaName: metadata.name,
                name: capability.name,
                description: capability.description,
            });
            capabilityCount++;
        }
        // Extract Hotkeys
        const extractedHotkeys = this.extractHotkeys(promptContent);
        let hotkeyCount = 0;
        for (const hotkey of extractedHotkeys) {
            await session.run(`
        MATCH (p:Persona {name: $personaName})
        MERGE (h:Hotkey {key: $key, personaName: $personaName})
        ON CREATE SET
          h.action = $action,
          h.description = $description,
          h.createdAt = datetime()
        MERGE (p)-[:USES_HOTKEY]->(h)
      `, {
                personaName: metadata.name,
                key: hotkey.key,
                action: hotkey.action,
                description: hotkey.description,
            });
            hotkeyCount++;
        }
        console.log(`  ✓ ${metadata.name}: ${directiveCount} directives, ${capabilityCount} capabilities, ${hotkeyCount} hotkeys`);
        return {
            personas: 1,
            directives: directiveCount,
            capabilities: capabilityCount,
            hotkeys: hotkeyCount,
        };
    }
    /**
     * Extract metadata from markdown header
     */
    extractMetadata(content, fileName) {
        const lines = content.split('\n');
        let name = fileName;
        let description;
        let author;
        let url;
        for (const line of lines.slice(0, 15)) {
            // ## Title
            if (line.startsWith('## ') && !name) {
                name = line.replace('## ', '').trim();
            }
            // Description line (usually after title)
            else if (!description && line.trim() && !line.startsWith('#') && !line.startsWith('By ') && !line.startsWith('http')) {
                description = line.trim();
            }
            // By Author
            else if (line.startsWith('By ')) {
                author = line.replace('By ', '').trim();
            }
            // URL
            else if (line.includes('chat.openai.com/g/') || line.includes('chatgpt.com/g/')) {
                url = line.trim();
            }
        }
        return { name, description, author, url };
    }
    /**
     * Extract prompt content from code blocks
     */
    extractPromptContent(content) {
        // Match content inside ```markdown ... ``` or ``` ... ```
        const codeBlockMatch = content.match(/```(?:markdown)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }
        // If no code block, try to get content after metadata
        const lines = content.split('\n');
        const contentStart = lines.findIndex((l, i) => i > 5 && l.trim() && !l.startsWith('#') && !l.startsWith('By ') && !l.includes('http'));
        if (contentStart > 0) {
            return lines.slice(contentStart).join('\n').trim();
        }
        return null;
    }
    /**
     * Extract directives from prompt content
     */
    extractDirectives(content) {
        const directives = [];
        const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 10);
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            // Determine directive type
            let type = 'rule';
            let priority = 5;
            if (DIRECTIVE_PATTERNS.restriction.test(trimmed)) {
                type = 'restriction';
                priority = 9; // High priority for restrictions
            }
            else if (DIRECTIVE_PATTERNS.capability.test(trimmed)) {
                type = 'capability';
                priority = 6;
            }
            else if (DIRECTIVE_PATTERNS.behavior.test(trimmed)) {
                type = 'behavior';
                priority = 7;
            }
            else if (DIRECTIVE_PATTERNS.tone.test(trimmed)) {
                type = 'tone';
                priority = 5;
            }
            else if (DIRECTIVE_PATTERNS.format.test(trimmed)) {
                type = 'format';
                priority = 4;
            }
            else if (DIRECTIVE_PATTERNS.rule.test(trimmed)) {
                type = 'rule';
                priority = 8;
            }
            else {
                continue; // Skip if no pattern matches
            }
            // Check for emphasis markers
            if (trimmed.toUpperCase() === trimmed || trimmed.includes('IMPORTANT') || trimmed.includes('MUST')) {
                priority = Math.min(10, priority + 2);
            }
            const id = crypto.createHash('md5').update(trimmed).digest('hex').substring(0, 12);
            directives.push({
                id,
                content: trimmed.substring(0, 500),
                type,
                priority,
            });
        }
        return directives;
    }
    /**
     * Extract capabilities from content
     */
    extractCapabilities(content) {
        const capabilities = [];
        const found = new Set();
        const lowerContent = content.toLowerCase();
        for (const { keyword, capability } of CAPABILITY_KEYWORDS) {
            if (lowerContent.includes(keyword) && !found.has(capability)) {
                found.add(capability);
                capabilities.push({
                    name: capability,
                    description: `Detected via keyword: "${keyword}"`,
                });
            }
        }
        return capabilities;
    }
    /**
     * Extract hotkey patterns
     */
    extractHotkeys(content) {
        const hotkeys = [];
        // Match patterns like "W: action" or "- W: action"
        const hotkeyRegex = /[-•*]?\s*([A-Z]{1,3})\s*[:：]\s*(.+?)(?:\n|$)/g;
        let match;
        while ((match = hotkeyRegex.exec(content)) !== null) {
            const key = match[1].trim();
            const description = match[2].trim();
            // Skip if too long (probably not a hotkey)
            if (description.length > 200)
                continue;
            hotkeys.push({
                key,
                action: key,
                description,
            });
        }
        return hotkeys;
    }
    /**
     * Create relationships between similar personas
     */
    async createPersonaRelationships(session) {
        // Connect personas with shared capabilities
        await session.run(`
      MATCH (p1:Persona)-[:HAS_CAPABILITY]->(c:Capability)<-[:HAS_CAPABILITY]-(p2:Persona)
      WHERE p1 <> p2
      MERGE (p1)-[:SHARES_CAPABILITY {capability: c.name}]->(p2)
    `);
        // Connect personas with similar directives (by type)
        await session.run(`
      MATCH (p1:Persona)-[:HAS_DIRECTIVE]->(d1:Directive)
      MATCH (p2:Persona)-[:HAS_DIRECTIVE]->(d2:Directive)
      WHERE p1 <> p2 AND d1.type = d2.type AND d1.priority >= 8 AND d2.priority >= 8
      WITH p1, p2, count(*) AS sharedCount
      WHERE sharedCount >= 3
      MERGE (p1)-[:SIMILAR_PERSONA {sharedDirectives: sharedCount}]->(p2)
    `);
    }
    /**
     * Get splice statistics
     */
    async getStats() {
        const session = this.driver.session();
        try {
            const result = await session.run(`
        MATCH (p:Persona) WITH count(p) AS personas
        MATCH (d:Directive) WITH personas, count(d) AS directives
        MATCH (c:Capability) WITH personas, directives, count(c) AS capabilities
        RETURN personas, directives, capabilities
      `);
            const topCaps = await session.run(`
        MATCH (p:Persona)-[:HAS_CAPABILITY]->(c:Capability)
        RETURN c.name AS name, count(p) AS count
        ORDER BY count DESC
        LIMIT 10
      `);
            const record = result.records[0];
            return {
                totalPersonas: record?.get('personas')?.toNumber() || 0,
                totalDirectives: record?.get('directives')?.toNumber() || 0,
                totalCapabilities: record?.get('capabilities')?.toNumber() || 0,
                topCapabilities: topCaps.records.map(r => ({
                    name: r.get('name'),
                    count: r.get('count').toNumber(),
                })),
            };
        }
        finally {
            await session.close();
        }
    }
    /**
     * Query personas by capability
     */
    async findPersonasByCapability(capability) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
        MATCH (p:Persona)-[:HAS_CAPABILITY]->(c:Capability {name: $capability})
        RETURN p.name AS name, p.description AS description
      `, { capability });
            return result.records.map(r => r.get('name'));
        }
        finally {
            await session.close();
        }
    }
    /**
     * Get directives for a persona
     */
    async getPersonaDirectives(personaName) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
        MATCH (p:Persona {name: $name})-[:HAS_DIRECTIVE]->(d:Directive)
        RETURN d.id AS id, d.content AS content, d.type AS type, d.priority AS priority
        ORDER BY d.priority DESC
      `, { name: personaName });
            return result.records.map(r => ({
                id: r.get('id'),
                content: r.get('content'),
                type: r.get('type'),
                priority: r.get('priority'),
            }));
        }
        finally {
            await session.close();
        }
    }
    async close() {
        await this.driver.close();
    }
}
// Premium prompt directories (real model system prompts)
DNASplicer.PREMIUM_PATHS = [
    'system_prompts_leaks-main/system_prompts_leaks-main/Anthropic',
    'system_prompts_leaks-main/system_prompts_leaks-main/OpenAI',
    'system_prompts_leaks-main/system_prompts_leaks-main/Google',
    'system_prompts_leaks-main/system_prompts_leaks-main/xAI',
    'system_prompts_leaks-main/system_prompts_leaks-main/Perplexity',
    'system_prompts_leaks-main/system_prompts_leaks-main/Misc',
];
export default DNASplicer;
