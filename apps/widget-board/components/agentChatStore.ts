import { create } from 'zustand';
import type { Message } from '../types';

// Simulerer et API-kald til en AI-agent
const callAIAgentAPI = async (message: string): Promise<string> => {
    console.log(`Sending to AI: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulerer netværksforsinkelse
    if (message.toLowerCase().includes('fejl')) {
        throw new Error('Simulated API error.');
    }
    return `Dette er et AI-svar på din besked: "${message}"`;
};

interface AgentChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearChat: () => void;
}

export const createAgentChatStore = () => create<AgentChatState>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,

    sendMessage: async (content: string) => {
        const userMessage: Message = { id: `user-${Date.now()}`, content, sender: 'user', timestamp: new Date() };
        set({ isLoading: true, error: null, messages: [...get().messages, userMessage] });

        try {
            const agentResponseContent = await callAIAgentAPI(content);
            const agentMessage: Message = { id: `agent-${Date.now()}`, content: agentResponseContent, sender: 'agent', timestamp: new Date() };
            set({ isLoading: false, messages: [...get().messages, agentMessage] });
        } catch (e) {
            const error = e instanceof Error ? e.message : 'An unknown error occurred.';
            set({ isLoading: false, error });
        }
    },

    clearChat: () => set({ messages: [], error: null }),
}));

// Vi eksporterer en factory-funktion. Dette er vigtigt for at sikre,
// at hver instans af AgentChatWidget får sin egen, isolerede state.
// Hvis vi eksporterede `create<...>()` direkte, ville alle chat-widgets dele den samme state.