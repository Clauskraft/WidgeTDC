# WidgetTDC AI-kommandoer (November 2025)

Dette dokument beskriver de anbefalede AI-modeller og workflows i WidgetTDC.

## Primære valg (Online)

| Kommando | Model | Brug til |
|---|---|---|
| `deepseek` | **deepseek-chat (V3)** | 🏆 **Standard:** Kodning, debugging, teknisk |
| `deepseek -m deepseek-reasoner` | **deepseek-reasoner (R1)** | Kompleks analyse, arkitektur, reasoning |
| `groq` | **llama-3.3-70b** | Quick spørgsmål, hurtig feedback (< 1s) |
| `gemini` | **gemini-3-pro** | Google integration, multimodal (billeder/video) |

> **Krav:** Alle online modeller kræver API nøgle konfigureret i indstillinger.

## Backup (Offline)

| Kommando | Model | Brug til |
|---|---|---|
| `local` | **qwen2.5:3b (Ollama)** | Nødsituation, fly/tog, ingen internet |

## NPU (Eksperimentelt)

| Kommando | Status |
|---|---|
| `nexa` | ⏳ Afventer NPU-modenhed (6-12 mdr) |

## Anbefalet Workflow

1.  **Kodning/debugging** → `deepseek` (V3)
2.  **Quick svar** → `groq`
3.  **Dyb analyse** → `deepseek -m deepseek-reasoner`
4.  **Offline/Privat** → `local` (Ollama)

---
*Opdateret: November 2025*

