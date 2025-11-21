# DeepSeek Agent Template

This folder contains the standard DeepSeek agent integration for Antigravity projects.

## How to use in a new project

1. Copy this folder to your new project (e.g., `agents/templates/deepseek`).
2. Run `install.bat` to install dependencies (`openai`, `dotenv`).
3. Copy `deepseek-wrapper.ts` to `src/agents/deepseek.ts`.
4. Add your API key to `.env`: `DEEPSEEK_API_KEY=sk-...`

## Agent Definition (Add to registry.yml)

```yaml
  - id: deepseek-llm
    name: DeepSeekLLM
    agent_type: llm-provider
    description: "DeepSeek Integration"
    resources_required:
      npm_packages: [openai, dotenv]
    implementation:
      outputs:
        files_created:
          - src/agents/deepseek.ts
```
