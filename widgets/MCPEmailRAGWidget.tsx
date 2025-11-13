
import React, { useState, useEffect } from 'react';
import type { Email, ReplySuggestion, Tone } from '../types';
import { Button } from '../components/ui/Button';

const MOCK_EMAILS: Email[] = [
  { id: 'email1', from: 'Peter Jensen', subject: 'Opfølgning på projekt "Phoenix"', body: 'Hej team, kan vi få en status på Phoenix-projektet? Deadline nærmer sig.', timestamp: '2024-05-21T10:00:00Z' },
  { id: 'email2', from: 'Susan Hansen', subject: 'Faktura #12345', body: 'Vedhæftet finder I faktura for sidste måneds ydelser. Betalingsfrist er om 14 dage.', timestamp: '2024-05-21T09:30:00Z' },
  { id: 'email3', from: 'Marketing Aps', subject: 'Invitation til webinar', body: 'Vi vil gerne invitere dig til vores gratis webinar om fremtidens AI-løsninger.', timestamp: '2024-05-20T15:00:00Z' },
];

const MOCK_SUGGESTIONS: Record<string, ReplySuggestion[]> = {
  'email1': [
    { text: 'Hej Peter,\n\nVi arbejder på det og forventer at have en opdatering klar EOD.\n\nVender tilbage snarest.\n\nMvh', confidence: 0.92, tone: 'Professionel', basedOnEmails: ['email098', 'email101'] },
    { text: 'Hej Peter, tak for din mail. Vi er på sporet og sender en status inden længe.', confidence: 0.85, tone: 'Venlig', basedOnEmails: ['email101'] },
  ],
  'email2': [
    { text: 'Hej Susan,\n\nTak for fremsendelse af faktura. Vi sørger for betaling inden fristen.\n\nMvh', confidence: 0.98, tone: 'Professionel', basedOnEmails: ['email201', 'email205'] },
    { text: 'Modtaget, tak!', confidence: 0.75, tone: 'Kortfattet', basedOnEmails: ['email202'] },
  ],
  'email3': [],
};


const MCPEmailRAGWidget: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // I en rigtig app ville dette være et API-kald via MCP
    setEmails(MOCK_EMAILS);
  }, []);

  const analyzeEmail = async (email: Email) => {
    setSelectedEmail(email);
    setIsLoading(true);
    setSuggestions([]);

    // Simulerer RAG engine og reply generator
    await new Promise(resolve => setTimeout(resolve, 750));

    setSuggestions(MOCK_SUGGESTIONS[email.id] || []);
    setIsLoading(false);
  };

  const ToneBadge: React.FC<{ tone: Tone }> = ({ tone }) => {
    const toneClasses: Record<Tone, string> = {
        'Professionel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Venlig': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Afslappet': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Kortfattet': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${toneClasses[tone]}`}>{tone}</span>;
  };

  return (
    <div className="h-full flex flex-col -m-4">
        <div className="flex-1 flex overflow-hidden">
            {/* Email List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <h3 className="p-4 text-sm font-semibold border-b border-gray-200 dark:border-gray-700">Indbakke</h3>
                <div className="flex-1 overflow-y-auto">
                    {emails.map(email => (
                        <button 
                            key={email.id} 
                            onClick={() => analyzeEmail(email)}
                            className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedEmail?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
                        >
                            <p className="font-semibold truncate">{email.from}</p>
                            <p className="text-sm truncate">{email.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email.body}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Suggestions Panel */}
            <div className="w-2/3 flex flex-col p-4">
                {!selectedEmail ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Vælg en email for at se svarsforslag.
                    </div>
                ) : isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-4">
                        <h3 className="font-bold text-lg">{selectedEmail.subject}</h3>
                        <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">{selectedEmail.body}</p>
                        <h4 className="font-semibold pt-2">Intelligente Svarsforslag</h4>
                        {suggestions.length > 0 ? suggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <ToneBadge tone={suggestion.tone} />
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{Math.round(suggestion.confidence * 100)}%</p>
                                        <p className="text-xs text-gray-500">Konfidens</p>
                                    </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-700/50 rounded">{suggestion.text}</p>
                                <div className="mt-2 text-right">
                                    <Button size="small">Brug forslag</Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500">Ingen relevante forslag fundet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MCPEmailRAGWidget;
