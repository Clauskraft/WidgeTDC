import fs from 'fs/promises';
import path from 'path';

/**
 * KnowledgeHarvester
 * Formål: At hente ekstern viden (System Prompts, Dokumentation) fra URL'er
 * og konvertere det til brugbar viden for The Architect.
 */
export class KnowledgeHarvester {
  // Vi gemmer viden centralt i pakke-strukturen så alle agenter kan tilgå det
  private libraryDir = path.resolve(__dirname, '../../../../packages/knowledge/library');

  constructor() {
    this.ensureLibraryExists();
  }

  private async ensureLibraryExists() {
    try {
      await fs.mkdir(this.libraryDir, { recursive: true });
    } catch (e) {
      // Ignorer hvis den findes
    }
  }

  /**
   * Høster rå tekst fra en URL (f.eks. GitHub Raw)
   */
  async harvestFromUrl(url: string, filename: string, category: 'system_prompt' | 'architecture' | 'agent_persona' | 'security_pattern'): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      console.log(`[HARVESTER] 🚜 Starter høst fra: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Kunne ikke hente URL: ${response.statusText} (${response.status})`);
      
      const rawText = await response.text();
      
      if (!rawText || rawText.length < 10) {
        throw new Error("Filen ser tom ud. Tjek om URL'en peger på 'Raw' content.");
      }

      // Vi renser teksten let (fjerner evt. BOM characters)
      const cleanedText = rawText.trim();

      // Sikr filnavn og sti
      const safeName = filename.endsWith('.md') || filename.endsWith('.txt') ? filename : `${filename}.md`;
      const savePath = path.join(this.libraryDir, category, safeName);
      
      // Opret undermappe (f.eks. /system_prompt)
      await fs.mkdir(path.dirname(savePath), { recursive: true });
      
      // Gem filen
      await fs.writeFile(savePath, cleanedText);

      console.log(`[HARVESTER] ✅ Viden sikret i: ${savePath}`);
      return { success: true, path: savePath };

    } catch (error: any) {
      console.error(`[HARVESTER] ❌ Fejl under høst:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lister al viden vi har høstet indtil videre
   */
  async getInventory(): Promise<string[]> {
    try {
        const categories = ['system_prompt', 'architecture', 'agent_persona', 'security_pattern'];
        let inventory: string[] = [];

        for (const cat of categories) {
            const catPath = path.join(this.libraryDir, cat);
            try {
                const files = await fs.readdir(catPath);
                inventory.push(...files.map(f => `[${cat}] ${f}`));
            } catch {
                // Mappen findes måske ikke endnu
            }
        }
        return inventory;
    } catch (e) {
        return [];
    }
  }
}

export const harvester = new KnowledgeHarvester();