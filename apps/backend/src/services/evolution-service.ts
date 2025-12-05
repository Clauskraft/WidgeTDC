import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'; // Loader variabler fra .env

interface AIResponse {
  code: string;
  modelUsed: string;
}

export class EvolutionService {
  // Stier til mapperne
  private liveDir = path.resolve(__dirname, '../../../../apps/matrix-frontend/src/widgets/generated');
  private stagingDir = path.resolve(__dirname, '../../../../apps/matrix-frontend/src/widgets/staging');

  // SYSTEM PROMPT: WidgeTDC Design Systemet (Opdateret med strengere regler)
  private systemPrompt = `
Du er "The Architect", en elite React-udvikler for WidgeTDC platformen.
Din opgave er at generere en moderne, responsiv Widget baseret på brugerens prompt.

DESIGN REGLER (SKAL OVERHOLDES):
1. **Glassmorphism:** Brug mørke baggrunde med transparens (f.eks. 'bg-[#051e3c]/90', 'border-white/10', 'backdrop-blur-md').
2. **Icons:** Brug KUN 'lucide-react' til ikoner.
3. **Layout:** Widgetten skal fylde 'h-full w-full' og håndtere overflow pænt.
4. **Interactivity:** Brug React hooks (useState, useEffect) til at gøre den levende.
5. **No Placeholders:** Brug ALDRIG 'Lorem Ipsum' eller 'Content here'. Generer realistisk mock-data hvis nødvendigt.
6. **Robustness:** Inkluder altid fejlhåndtering i komponenten.

TEKNISKE KRAV:
1. Output KUN ren kode. Ingen markdown blokke (\`\`\`), ingen forklaringer før/efter.
2. Komponenten skal eksporteres som 'default'.
3. Importer React korrekt.
`;

  // --- HOVEDMETODE: GENERER TIL STAGING ---
  async generateWidget(userPrompt: string): Promise<{ success: boolean; filename?: string; code?: string; error?: string; model?: string }> {
    try {
      console.log(`[ARCHITECT] 🧠 Modtog ordre: "${userPrompt.substring(0, 50)}..."`);

      const componentName = 'DynamicWidget_' + Date.now();
      const filename = `${componentName}.tsx`;

      // 1. KALD AI (Smart routing)
      const aiResult = await this.callSmartLLM(userPrompt, componentName);

      let rawCode = aiResult.code;

      // 2. RENS KODEN (Fjern markdown hvis AI'en glemte reglerne)
      rawCode = rawCode.replace(/```tsx/g, '').replace(/```typescript/g, '').replace(/```/g, '').trim();

      // Sikkerhedsnet: Tjek at koden ser valid ud
      if (!rawCode.includes('export default')) {
        throw new Error("AI genererede ugyldig kode (manglede export default)");
      }

      // 3. GEM TIL STAGING (Klar til review)
      await fs.mkdir(this.stagingDir, { recursive: true });
      await fs.writeFile(path.join(this.stagingDir, filename), rawCode);

      console.log(`[ARCHITECT] ✨ Kode genereret med ${aiResult.modelUsed}: ${filename}`);

      return { success: true, filename, code: rawCode, model: aiResult.modelUsed };

    } catch (error: any) {
      console.error("[ARCHITECT] ❌ Critical Failure:", error);
      return { success: false, error: error.message };
    }
  }

  // --- INTELLIGENT LLM ROUTER ---
  private async callSmartLLM(userPrompt: string, componentName: string): Promise<AIResponse> {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    // Debug: Tjek om nøgler findes (uden at logge dem)
    if (!anthropicKey && !openaiKey && !deepseekKey) {
        console.error("[ARCHITECT] INGEN API NØGLER FUNDET I .env!");
        throw new Error("Ingen API nøgler konfigureret. Tjek .env filen i backend.");
    }

    const fullPrompt = `Lav en React komponent kaldet '${componentName}'.\nFunktionalitet: ${userPrompt}`;

    // OPTION A: OPENAI (GPT-4o - Foretrukket til UI kode)
    if (openaiKey) {
      try {
        console.log("[ARCHITECT] 🚀 Forbinder til OpenAI (GPT-4o)...");
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: this.systemPrompt },
              { role: 'user', content: fullPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.2
          })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API Error: ${errText}`);
        }

        const data: any = await response.json();
        console.log("[ARCHITECT] ✨ GPT-4o genererede koden succesfuldt!");
        return { code: data.choices[0].message.content, modelUsed: 'GPT-4o' };
      } catch (err: any) {
        console.warn("[ARCHITECT] OpenAI fejlede, forsøger fallback...", err.message);
      }
    }

    // OPTION B: ANTHROPIC (Claude 3.5 Sonnet - Fallback)
    if (anthropicKey) {
      try {
        console.log("[ARCHITECT] Forbinder til Anthropic (Claude 3.5 Sonnet)...");
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4000,
            system: this.systemPrompt,
            messages: [{ role: 'user', content: fullPrompt }]
          })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Anthropic API Error: ${errText}`);
        }

        const data: any = await response.json();
        return { code: data.content[0].text, modelUsed: 'Claude 3.5 Sonnet' };
      } catch (err: any) {
        console.warn("[ARCHITECT] Anthropic fejlede, forsøger fallback...", err.message);
      }
    }

    // OPTION C: DEEPSEEK (Final fallback)
    if (deepseekKey) {
      console.log("[ARCHITECT] Forbinder til DeepSeek...");
      const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-coder',
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`DeepSeek API Error: ${errText}`);
      }

      const data: any = await response.json();
      return { code: data.choices[0].message.content, modelUsed: 'DeepSeek' };
    }

    throw new Error("Alle AI providers fejlede. Tjek internetforbindelse og API status.");
  }

  // --- DEPLOYMENT LOGIK ---
  async promoteWidget(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sourcePath = path.join(this.stagingDir, filename);
      const destPath = path.join(this.liveDir, filename);

      // Tjek om staging filen eksisterer
      try {
        await fs.access(sourcePath);
      } catch {
        throw new Error(`Kan ikke finde filen ${filename} i staging. Måske er den allerede deployet?`);
      }

      // Flyt filen
      await fs.rename(sourcePath, destPath);
      console.log(`[ARCHITECT] 🚀 DEPLOYED TO PRODUCTION: ${filename}`);
      return { success: true };
    } catch (error: any) {
      console.error("[ARCHITECT] Deployment fejl:", error);
      return { success: false, error: error.message };
    }
  }

  async discardWidget(filename: string) {
    try {
      await fs.unlink(path.join(this.stagingDir, filename));
      console.log(`[ARCHITECT] 🗑️ Kasseret: ${filename}`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

export const evolutionService = new EvolutionService();
