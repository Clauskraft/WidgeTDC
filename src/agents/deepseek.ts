import { OpenAI } from 'openai';

// DeepSeek is API-compatible with OpenAI
export class DeepSeekClient {
    private client: OpenAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.DEEPSEEK_API_KEY;
        if (!key) {
            console.warn('DeepSeek API Key not found in environment variables');
        }

        this.client = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: key || 'dummy-key-for-init', // Prevent crash on init if key missing
        });
    }

    async query(prompt: string, systemPrompt: string = 'You are a helpful AI assistant.') {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-coder",
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            throw error;
        }
    }

    async generateCode(requirement: string) {
        return this.query(requirement, "You are an expert software engineer. Output only clean, working code.");
    }
}

// Simple CLI test if run directly
if (require.main === module) {
    const deepSeek = new DeepSeekClient();
    console.log("Testing DeepSeek connection...");
    deepSeek.query("Say hello").then(console.log).catch(console.error);
}
