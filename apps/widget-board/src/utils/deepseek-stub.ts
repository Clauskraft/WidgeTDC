export class DeepSeekAPI {
    private apiKey: string;
    constructor(config: { apiKey: string }) {
        this.apiKey = config.apiKey;
    }
    // Minimal mock implementation matching the usage in the codebase
    chat = {
        completions: {
            create: async (options: any) => {
                // Return a mock response structure compatible with the existing code
                return {
                    choices: [{ message: { content: 'Mock response from DeepSeek' } }],
                    usage: {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                    },
                };
            },
        },
    };
}
