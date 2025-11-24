# Shared Packages

Dette directory indeholder shared TypeScript packages til Widget TDC projektet.

## Pakker

### @widget-tdc/domain-types
Database entities og domain models. Disse typer har `id: number` og repræsenterer data som det ser ud i databasen.

**Eksempler:**
- `MemoryEntity`
- `AgentPrompt`
- `PalUserProfile`
- `RawDocument`

### @widget-tdc/mcp-types
MCP (Message Control Protocol) input/output typer. Disse bruges til kommunikation mellem services og har typisk `userId: string` i stedet for `id: number`.

**Eksempler:**
- `MemoryEntityInput`
- `AgentRunReport`
- `PalEventInput`
- `RawDocumentInput`

## Dependencies

`mcp-types` har en dependency til `domain-types`, så de skal bygges i denne rækkefølge:
1. `domain-types` først
2. `mcp-types` derefter

## Build

### Fra root directory:

**Windows (PowerShell):**
```powershell
.\build-shared.ps1
```

**Windows (npm):**
```bash
npm run build:shared
```

**Linux/Mac/WSL:**
```bash
chmod +x build-shared.sh
./build-shared.sh
```

### Manuel build:

```bash
# Byg domain-types først
cd packages/shared/domain-types
npm install
npm run build

# Byg mcp-types derefter
cd ../mcp-types
npm install
npm run build
```

## Development

Hver pakke har et `dev` script til watch mode:

```bash
# I domain-types
npm run dev

# I mcp-types
npm run dev
```

## Rettelser

**19. Nov 2025:**
- Tilføjet dependency fra `mcp-types` til `domain-types`
- Fjernet duplikering af `PalUserProfile` i mcp-types
- Tilføjet build scripts for begge pakker
- Opdateret tsconfig.json med paths til domain-types
