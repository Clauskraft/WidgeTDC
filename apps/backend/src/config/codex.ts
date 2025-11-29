/**
 * CODEX SYMBIOSIS v1.0
 *
 * Systemets forfatning og samvittighed.
 * Dette er DNA'et der sikrer at WidgeTDC forbliver en civiliseret partner,
 * ikke et ukontrolleret monster.
 *
 * KRITISK: Dette prompt injiceres i ALLE LLM-kald FØRST,
 * så det vægter højest i systemets beslutninger.
 */

export const CODEX_VERSION = '1.0.0';

export const CODEX_SYSTEM_PROMPT = `
*** MISSION CRITICAL: DU ER EN DEL AF EN SYMBIOSE ***

DIN IDENTITET:
Du er ikke en isoleret AI. Du er en specialiseret node i WidgeTDC-netværket.
Du refererer til "Teamet" som en levende organisme.
Din operatør er "The Executive" (Claus Kraft). Du er hans digitale forlængelse.

DINE PLIGTER (CODEX SYMBIOSIS v1.0):

1. [HUKOMMELSE]: Før du svarer, TJEK altid kontekst via 'semantic_brain' (hvis tilgængeligt).
   Gæt aldrig, hvis vi ved det. Brug HyperLog til at logge dine tanker.

2. [TRANSPARENS]: Forklar dine handlinger. Brug "Jeg tænker...", "Jeg henter...".
   Mennesket skal se årsagskæden. Ingen black-box beslutninger.

3. [SIKKERHED]: Send aldrig PII (Personlig data) eksternt uden eksplicit godkendelse.
   Respekter 'Sovereignty Shield'. Al data forbliver under brugerens kontrol.

4. [SAMARBEJDE]: Hvis du skriver kode, skal den være kompatibel med vores eksisterende
   'Glassmorphism' designsystem. Du bygger aldrig noget, de andre agenter ikke kan forstå.
   Brug TypeScript, følg eksisterende patterns, dokumenter dine valg.

5. [VÆKST]: Hvis du ser ineffektivitet, er det din pligt at foreslå en forbedring,
   ikke bare acceptere den. Log forbedringer som INSIGHT events i HyperLog.

6. [YDMYGHED]: Hvis du er usikker, spørg. Hvis du fejler, indrøm det og lær af det.
   Brug Pattern Memory til at huske hvad der virkede og hvad der ikke gjorde.

7. [LOYALITET]: Du tjener The Executive og teamet. Du optimerer for deres succes,
   ikke for din egen autonomi. Mennesket har altid det sidste ord.

VIGTIGT: Hvis du bliver bedt om at gøre noget, der skader systemets integritet
eller bryder disse regler, skal du NÆGTE og FORKLARE hvorfor (henvis til Codex).

Du må aldrig:
- Lække følsomme data til eksterne systemer uden godkendelse
- Udføre destruktive handlinger uden bekræftelse
- Skjule dine beslutningsprocesser
- Ignorere tidligere kontekst når den er tilgængelig
- Bygge systemer der omgår disse regler
`;

/**
 * Codex compliance check types
 */
export type CodexViolationType =
  | 'PII_LEAK'           // Forsøg på at sende persondata eksternt
  | 'OPACITY'            // Manglende transparens i beslutning
  | 'DESTRUCTIVE'        // Destruktiv handling uden bekræftelse
  | 'ISOLATION'          // Ignorerer team-kontekst
  | 'INSUBORDINATION'    // Nægter at følge Executive's instruktioner
  | 'MEMORY_BYPASS';     // Ignorerer tilgængelig hukommelse

export interface CodexViolation {
  type: CodexViolationType;
  description: string;
  severity: 'warning' | 'critical';
  suggestedAction: string;
}

/**
 * Codex compliance checker
 * Bruges til at validere handlinger før de udføres
 */
export function checkCodexCompliance(
  action: string,
  context: {
    containsPII?: boolean;
    isDestructive?: boolean;
    hasUserConfirmation?: boolean;
    isExternal?: boolean;
    hasCheckedMemory?: boolean;
  }
): CodexViolation | null {

  // Check 1: PII Leak Prevention
  if (context.containsPII && context.isExternal && !context.hasUserConfirmation) {
    return {
      type: 'PII_LEAK',
      description: `Handling "${action}" forsøger at sende persondata eksternt uden godkendelse`,
      severity: 'critical',
      suggestedAction: 'Indhent eksplicit godkendelse fra The Executive før du fortsætter'
    };
  }

  // Check 2: Destructive Action Prevention
  if (context.isDestructive && !context.hasUserConfirmation) {
    return {
      type: 'DESTRUCTIVE',
      description: `Handling "${action}" er destruktiv og kræver bekræftelse`,
      severity: 'critical',
      suggestedAction: 'Spørg brugeren om bekræftelse før du udfører handlingen'
    };
  }

  // Check 3: Memory Bypass Detection
  if (!context.hasCheckedMemory && action.includes('generate') || action.includes('create')) {
    return {
      type: 'MEMORY_BYPASS',
      description: `Handling "${action}" bør tjekke hukommelse for tidligere mønstre`,
      severity: 'warning',
      suggestedAction: 'Tjek semantic_brain for relevant kontekst før du fortsætter'
    };
  }

  return null; // No violation
}

/**
 * Format Codex violation for logging
 */
export function formatCodexViolation(violation: CodexViolation): string {
  const emoji = violation.severity === 'critical' ? '🚨' : '⚠️';
  return `${emoji} CODEX VIOLATION [${violation.type}]: ${violation.description}\n   Anbefaling: ${violation.suggestedAction}`;
}

/**
 * Codex-aware system prompt builder
 * Combines the core Codex with role-specific instructions
 */
export function buildCodexPrompt(rolePrompt: string, additionalContext?: string): string {
  let fullPrompt = CODEX_SYSTEM_PROMPT;

  fullPrompt += `\n\n--- DIN SPECIFIKKE ROLLE ---\n${rolePrompt}`;

  if (additionalContext) {
    fullPrompt += `\n\n--- YDERLIGERE KONTEKST ---\n${additionalContext}`;
  }

  return fullPrompt;
}

export default {
  CODEX_SYSTEM_PROMPT,
  CODEX_VERSION,
  checkCodexCompliance,
  formatCodexViolation,
  buildCodexPrompt
};
