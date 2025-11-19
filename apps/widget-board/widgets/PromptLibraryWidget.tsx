import React, { useMemo, useState } from 'react';
import type { Prompt } from '../types';
import { Button } from '../components/ui/Button';

const MOCK_PROMPTS: Prompt[] = [
  { id: '1', title: 'Opsummer GDPR Artikel 5', text: 'Giv en koncis opsummering af hovedpunkterne i GDPR Artikel 5.', category: 'GDPR', tags: ['opsummering', 'artikel-5'] },
  { id: '2', title: 'Analyser Schrems II', text: 'Giv en statusoversigt over Schrems II-dommen og dens konsekvenser.', category: 'Compliance', tags: ['schrems-ii', 'dataoverførsel'] },
  { id: '3', title: 'Databehandleraftale Check', text: 'Oplist de nødvendige punkter for en GDPR-kompatibel databehandleraftale.', category: 'Kontrakt', tags: ['dpa', 'compliance'] }
];

const PromptLibraryWidget: React.FC<{ widgetId: string }> = () => {
  const [prompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, promptId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredPrompts = useMemo(() => 
    prompts.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ), 
    [prompts, searchTerm]
  );

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Søg i prompts..."
          className="ms-focusable w-full p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPrompts.length > 0 ? filteredPrompts.map(prompt => (
          <div key={prompt.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
            <h3 className="font-semibold">{prompt.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 my-2">{prompt.text}</p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {prompt.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">#{tag}</span>
                ))}
              </div>
              <Button
                onClick={() => copyToClipboard(prompt.text, prompt.id)}
                variant={copiedId === prompt.id ? 'success' : 'primary'}
                size="small"
              >
                {copiedId === prompt.id ? 'Kopieret!' : 'Kopiér'}
              </Button>
            </div>
          </div>
        )) : (
            <div className="text-center text-gray-500 py-8">Ingen prompts fundet.</div>
        )}
      </div>
    </div>
  );
};

export default PromptLibraryWidget;