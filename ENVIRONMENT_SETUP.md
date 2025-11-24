# Environment Configuration Instructions

## Current Setup (Local Development - Free)

The system is now configured to use **Transformers.js** for local embeddings.

### What to do:

1. **Install the package** (running in background):
   ```bash
   npm install @xenova/transformers
   ```

2. **Create your .env file:**
   ```bash
   cd apps/backend
   cp .env.example .env
   ```

3. **Add this line to your .env:**
   ```bash
   EMBEDDING_PROVIDER="transformers"
   ```

4. **That's it!** No API keys needed for local mode.

---

## Production Setup (Best Quality)

For production with the highest quality embeddings:

1. **Get an OpenAI API key** from https://platform.openai.com/api-keys

2. **Update your .env:**
   ```bash
   EMBEDDING_PROVIDER="openai"
   OPENAI_API_KEY="sk-your-actual-key-here"
   ```

3. **Cost:** ~$0.00002 per 1K tokens (very cheap)

---

## Alternative: HuggingFace (Free Tier)

1. **Get a HuggingFace token** from https://huggingface.co/settings/tokens

2. **Update your .env:**
   ```bash
   EMBEDDING_PROVIDER="huggingface"
   HUGGINGFACE_API_KEY="hf_your-token-here"
   ```

---

## Auto-Select (Recommended for Now)

If you don't set `EMBEDDING_PROVIDER`, the system will automatically try:
1. OpenAI (if key is set)
2. HuggingFace (if key is set)
3. Transformers.js (always works locally)

Just ensure @xenova/transformers is installed and you're good to go!
