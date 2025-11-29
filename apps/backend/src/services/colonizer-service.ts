import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLlmService, ChatMessage } from './llm/llmService.js';
import { CODEX_VERSION } from '../config/codex.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * THE COLONIZER SERVICE
 *
 * Systemets vækst-motor. Dens formål er at "spise" eksterne API'er
 * og omdanne dem til Codex-compliant MCP Tools.
 *
 * VIGTIGT: Fordi alle LLM-kald nu går gennem Codex-filteret,
 * vil de genererede tools automatisk overholde vores etiske regler.
 * Systemet kan vokse, men det vil aldrig vokse ukontrolleret.
 *
 * Processen kaldes "Assimilation" - vi gør det fremmede til en del af os.
 */

export interface AssimilationResult {
  success: boolean;
  message: string;
  systemName?: string;
  filename?: string;
  toolCount?: number;
  code?: string;
}

export interface AssimilationOptions {
  systemName: string;
  apiSpecContent: string;
  generateTests?: boolean;
  dryRun?: boolean;
}

export class ColonizerService {
  private toolsDir = path.resolve(__dirname, '../tools/generated');
  private llmService = getLlmService();

  /**
   * ASSIMILATE: Den proces, hvor vi gør et fremmed system til en del af os.
   *
   * @param systemName Navnet på det nye territorium (f.eks. "Economic", "HubSpot")
   * @param apiSpecContent API dokumentation (Swagger/OpenAPI JSON eller rå tekst)
   */
  async assimilateSystem(options: AssimilationOptions): Promise<AssimilationResult> {
    const { systemName, apiSpecContent, generateTests = false, dryRun = false } = options;

    console.log(`\n🛸 [COLONIZER] Starter kolonisering af: ${systemName}`);
    console.log(`   Codex v${CODEX_VERSION} sikrer etisk compliance...`);

    try {
      // 1. Analyser API'et først
      const analysis = await this.analyzeApi(systemName, apiSpecContent);
      console.log(`   📊 API analyseret: ${analysis.endpointCount} endpoints identificeret`);

      // 2. Generer MCP Tool kode
      // BEMÆRK: Denne prompt sendes gennem LLM Service, så den får automatisk CODEX med!
      // Det betyder, at det nye tool automatisk vil overholde sikkerhedsreglerne.
      const assimilationPrompt = this.buildAssimilationPrompt(systemName, apiSpecContent, analysis);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Du er The Architect i WidgeTDC-teamet. Din opgave er at skabe nye MCP Tool integrationer.
          Du skriver altid TypeScript, følger eksisterende patterns, og sørger for at nye tools er kompatible med systemet.`
        },
        {
          role: 'user',
          content: assimilationPrompt
        }
      ];

      const result = await this.llmService.complete({
        model: process.env.COLONIZER_MODEL || 'gpt-4o',
        messages,
        temperature: 0.3, // Lav temperatur for konsistent kode
        maxTokens: 4000
      });

      const generatedCode = this.extractCode(result.content);

      if (!generatedCode) {
        return {
          success: false,
          message: 'Kunne ikke generere gyldig TypeScript kode fra API specifikation'
        };
      }

      // 3. Valider den genererede kode
      const validation = this.validateGeneratedCode(generatedCode, systemName);
      if (!validation.isValid) {
        console.warn(`   ⚠️  Validation warnings: ${validation.warnings.join(', ')}`);
      }

      // 4. Gem koden (medmindre det er dry-run)
      if (!dryRun) {
        const filename = `${systemName.toLowerCase()}-integration.ts`;
        await fs.mkdir(this.toolsDir, { recursive: true });
        await fs.writeFile(path.join(this.toolsDir, filename), generatedCode);

        console.log(`   ✅ ${systemName} er nu assimileret. Kode gemt i ${filename}`);

        // 5. Generer tests hvis ønsket
        if (generateTests) {
          const testCode = await this.generateTests(systemName, generatedCode);
          const testFilename = `${systemName.toLowerCase()}-integration.test.ts`;
          await fs.writeFile(path.join(this.toolsDir, testFilename), testCode);
          console.log(`   🧪 Tests genereret: ${testFilename}`);
        }

        // 6. Log til HyperLog
        await this.logAssimilation(systemName, analysis.endpointCount);

        return {
          success: true,
          message: `Systemet ${systemName} er assimileret. Genstart serveren for at aktivere de nye sanser.`,
          systemName,
          filename,
          toolCount: analysis.endpointCount,
          code: generatedCode
        };
      } else {
        // Dry run - returner kun koden uden at gemme
        return {
          success: true,
          message: `[DRY RUN] Kode genereret for ${systemName}, men ikke gemt.`,
          systemName,
          toolCount: analysis.endpointCount,
          code: generatedCode
        };
      }

    } catch (error: any) {
      console.error(`   ❌ Assimilation fejlede:`, error.message);
      return {
        success: false,
        message: `Assimilation fejlede: ${error.message}`
      };
    }
  }

  /**
   * Analyser API specifikation for at forstå strukturen
   */
  private async analyzeApi(systemName: string, spec: string): Promise<{
    endpointCount: number;
    endpoints: string[];
    hasAuth: boolean;
    version?: string;
  }> {
    // Forsøg at parse som OpenAPI/Swagger
    try {
      const parsed = JSON.parse(spec);

      if (parsed.openapi || parsed.swagger) {
        const paths = Object.keys(parsed.paths || {});
        return {
          endpointCount: paths.length,
          endpoints: paths.slice(0, 10), // Første 10 for reference
          hasAuth: !!parsed.components?.securitySchemes || !!parsed.securityDefinitions,
          version: parsed.info?.version
        };
      }
    } catch {
      // Ikke JSON - analyser som tekst
    }

    // Fallback: Simpel tekst-analyse
    const lines = spec.split('\n');
    const endpointPatterns = lines.filter(l =>
      /\b(GET|POST|PUT|DELETE|PATCH)\s+\//.test(l)
    );

    return {
      endpointCount: Math.max(endpointPatterns.length, 3), // Minimum 3 antaget
      endpoints: endpointPatterns.slice(0, 10),
      hasAuth: /auth|token|api[_-]?key/i.test(spec)
    };
  }

  /**
   * Byg den prompt der får Arkitekten til at skabe det nye tool
   */
  private buildAssimilationPrompt(
    systemName: string,
    apiSpec: string,
    analysis: { endpointCount: number; endpoints: string[]; hasAuth: boolean }
  ): string {
    // Truncate spec hvis den er for lang
    const truncatedSpec = apiSpec.length > 12000
      ? apiSpec.substring(0, 12000) + '\n\n[... truncated for context limits ...]'
      : apiSpec;

    return `
OPGAVE: SKAB ET NYT MCP TOOL INTEGRATION FOR "${systemName.toUpperCase()}"

Vi skal integrere systemet "${systemName}" i WidgeTDC sværmen.

## API ANALYSE
- Antal endpoints: ${analysis.endpointCount}
- Kræver authentication: ${analysis.hasAuth ? 'Ja' : 'Nej'}
- Eksempel endpoints: ${analysis.endpoints.slice(0, 5).join(', ')}

## API SPECIFIKATION/DOKUMENTATION
\`\`\`
${truncatedSpec}
\`\`\`

## KRAV TIL DET NYE TOOL

1. **Fil struktur**: Skriv en TypeScript fil, der eksporterer en funktion \`register${systemName}Tools(mcpRegistry)\`.

2. **Tool registrering**: Funktionen skal registrere MCP tools for de vigtigste endpoints.
   Brug dette pattern:
   \`\`\`typescript
   mcpRegistry.registerTool('${systemName.toLowerCase()}.action_name', {
     description: 'Beskrivelse af hvad dette tool gør',
     inputSchema: { type: 'object', properties: {...}, required: [...] },
     handler: async (params) => { ... }
   });
   \`\`\`

3. **Fejlhåndtering**: Inkluder try/catch og returner meningsfulde fejlbeskeder.

4. **Codex Compliance**: Log vigtige handlinger til HyperLog hvis muligt:
   \`\`\`typescript
   import { hyperLog } from '../services/hyper-log.js';
   await hyperLog.log('TOOL_EXECUTION', '${systemName}', 'Handling udført', { endpoint: '...' });
   \`\`\`

5. **Authentication**: ${analysis.hasAuth
      ? 'Brug environment variable for API key: process.env.' + systemName.toUpperCase() + '_API_KEY'
      : 'Ingen auth påkrævet ifølge spec.'
    }

6. **Dokumentation**: Tilføj JSDoc kommentarer til hvert tool.

Output KUN koden indkapslet i \`\`\`typescript ... \`\`\` blokke.
    `;
  }

  /**
   * Ekstrahér TypeScript kode fra LLM response
   */
  private extractCode(response: string): string | null {
    // Find kode mellem ```typescript og ```
    const match = response.match(/```typescript\n([\s\S]*?)```/);
    if (match) {
      return match[1].trim();
    }

    // Fallback: Prøv bare ```
    const fallbackMatch = response.match(/```\n?([\s\S]*?)```/);
    if (fallbackMatch) {
      return fallbackMatch[1].trim();
    }

    return null;
  }

  /**
   * Valider den genererede kode
   */
  private validateGeneratedCode(code: string, systemName: string): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for register function
    if (!code.includes(`register${systemName}Tools`)) {
      warnings.push('Mangler register function med korrekt navn');
    }

    // Check for mcpRegistry usage
    if (!code.includes('mcpRegistry') && !code.includes('registerTool')) {
      warnings.push('Mangler mcpRegistry integration');
    }

    // Check for error handling
    if (!code.includes('try') || !code.includes('catch')) {
      warnings.push('Mangler fejlhåndtering (try/catch)');
    }

    // Check for suspicious patterns
    if (code.includes('eval(') || code.includes('Function(')) {
      warnings.push('SIKKERHED: Potentielt farlig kode opdaget (eval/Function)');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Generer unit tests for det nye tool
   */
  private async generateTests(systemName: string, code: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Du skriver unit tests i Vitest format for TypeScript kode.'
      },
      {
        role: 'user',
        content: `Skriv unit tests for denne ${systemName} integration:

\`\`\`typescript
${code.substring(0, 3000)}
\`\`\`

Brug Vitest syntax (describe, it, expect). Mock external API calls.
Output kun koden.`
      }
    ];

    const result = await this.llmService.complete({
      model: 'gpt-4o-mini', // Billigere model til tests
      messages,
      temperature: 0.2
    });

    return this.extractCode(result.content) || `// Tests for ${systemName}\n// TODO: Add tests`;
  }

  /**
   * Log assimilation til HyperLog
   */
  private async logAssimilation(systemName: string, endpointCount: number): Promise<void> {
    try {
      const { hyperLog } = await import('./hyper-log.js');
      await hyperLog.log(
        'INSIGHT',
        'TheColonizer',
        `Nyt system assimileret: ${systemName} (${endpointCount} endpoints)`,
        {
          systemName,
          endpointCount,
          timestamp: new Date().toISOString()
        }
      );
    } catch {
      // HyperLog not available, continue silently
    }
  }

  /**
   * List alle assimilerede systemer
   */
  async listAssimilatedSystems(): Promise<string[]> {
    try {
      await fs.mkdir(this.toolsDir, { recursive: true });
      const files = await fs.readdir(this.toolsDir);
      return files
        .filter(f => f.endsWith('-integration.ts') && !f.includes('.test.'))
        .map(f => f.replace('-integration.ts', ''));
    } catch {
      return [];
    }
  }

  /**
   * Fjern et assimileret system
   */
  async removeSystem(systemName: string): Promise<boolean> {
    try {
      const filename = `${systemName.toLowerCase()}-integration.ts`;
      await fs.unlink(path.join(this.toolsDir, filename));

      // Prøv også at fjerne test fil
      try {
        await fs.unlink(path.join(this.toolsDir, `${systemName.toLowerCase()}-integration.test.ts`));
      } catch {
        // Test fil eksisterer måske ikke
      }

      console.log(`🗑️ [COLONIZER] System fjernet: ${systemName}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const colonizerService = new ColonizerService();

export default colonizerService;
