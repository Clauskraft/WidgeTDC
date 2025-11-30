# Knowledge Base

The system's subconscious - where harvested knowledge is stored.

## Structure

```
packages/knowledge/
├── harvested/          # Raw content fetched by The Harvester
│   ├── *.txt           # Text files
│   ├── *.md            # Markdown files
│   ├── *.json          # JSON data
│   └── *.meta.json     # Metadata for each harvested file
└── processed/          # (Future) Analyzed and structured knowledge
```

## The Harvester

The Harvester service (`apps/backend/src/services/harvester/`) provides the capability to reach out and acquire knowledge from external sources.

### MCP Tools

- `harvest.fetch` - Reach out and grab content from a URL
- `harvest.list` - List all harvested knowledge files
- `harvest.read` - Read a specific harvested file

### Example Usage

```typescript
// Via MCP
await mcpClient.call('harvest.fetch', {
  url: 'https://raw.githubusercontent.com/user/repo/main/document.md',
  filename: 'custom_name.md'  // optional
});

// List harvested files
await mcpClient.call('harvest.list', {});

// Read harvested content
await mcpClient.call('harvest.read', { filename: 'document.md' });
```

## Philosophy

> "Vi skal ikke vente på mirakler; vi skal hente dem."

The knowledge base represents the accumulated wisdom harvested from the digital void. Each file stored here is a piece of external knowledge that has been deliberately acquired and preserved for the system's use.
