# Dokumentgenerator Widgets

Denne mappe indeholder autonome dokumentgenerator widgets for PowerPoint, Word og Excel.

## Widgets i denne mappe

| Widget | Størrelse | Linjer | Status |
|--------|-----------|--------|--------|
| `autonomous-powerpoint-master.tsx` | 35 KB | 1113 | ⏳ TIL IMPLEMENTATION |
| `autonomous-word-architect.tsx` | 47 KB | 1202 | ⏳ TIL IMPLEMENTATION |
| `autonomous-excel-analyzer.tsx` | 38 KB | 1230 | ⏳ TIL IMPLEMENTATION |

## Backend Integration

Disse widgets kræver backend integration med MCP servers:

### MCP PowerPoint Server
```bash
# Start eksisterende Clauskraft/powerpoint MCP server
uv --directory /path/to/powerpoint run powerpoint --folder-path ./presentations
```

### PPTAgent (Docker)
```bash
docker run -dt --gpus all --name pptagent \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 9297:9297 -p 8088:8088 \
  forceless/pptagent
```

## Features per Widget

### PowerPoint Master
- 🔬 AI Research: Web search & knowledge extraction
- 🎨 Intelligent Layouts: Lærer fra world-class præsentationer
- 🖼️ Auto Images: DALL-E 3, Stable Diffusion, FLUX
- 📊 Smart Charts: Automatisk data visualization
- 🎭 Brand Intelligence: Lærer brand guidelines
- 🌍 Multi-language: 50+ sprog
- ⚡ Multi-threaded: 11+ parallel threads

### Word Architect
- 📄 Multi-Format: PDF, DOCX, TXT, MD, HTML → DOCX
- 🧠 AI Analysis: Extract insights, entities, topics
- 📊 Data → Document: Transform analysis til professional docs
- 📋 50+ Templates: Legal, business, technical, security
- 🔍 Knowledge Mining: NER, topic modeling
- ⚡ 16+ Threads: Parallel processing pipeline

### Excel Analyzer
- 📈 Data → Insights: Raw data til intelligent analysis
- 💹 Financial Models: P&L, cash flow, DCF, pro forma
- 🔄 Auto Pivots: Intelligent pivot table generation
- 📊 Smart Charts: Automatic chart type selection
- 🧮 AI Formulas: Advanced Excel formulas
- 📉 Predictive Analytics: Trend analysis & forecasting

## Color Scheme (Purple theme)

```typescript
const DOC_GEN_COLORS = {
  primary: '#8B5CF6',
  secondary: '#A78BFA',
  accent: '#C4B5FD',
  background: 'from-slate-900 via-purple-900 to-slate-900'
};
```

## Dependencies

```bash
npm install lucide-react zustand @xenova/transformers
```

## Usage

```typescript
import { AutonomousPowerPointMaster } from './widgets/doc-generators/autonomous-powerpoint-master';
import { AutonomousWordArchitect } from './widgets/doc-generators/autonomous-word-architect';
import { AutonomousExcelAnalyzer } from './widgets/doc-generators/autonomous-excel-analyzer';
```

## Environment Variables

```env
OPENAI_API_KEY=          # For PPTAgent
TOGETHER_API_KEY=        # For FLUX image generation
POWERPOINT_MCP_PATH=     # Path to Clauskraft/powerpoint
PRESENTATIONS_PATH=      # Output path for generated files
```
