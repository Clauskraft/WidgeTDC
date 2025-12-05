import React, { useState, useCallback } from 'react';
import { InfoItem, AIProvider, ItemType, Priority, Status, SecurityLevel, ExtractedEntity } from '../types';
import { multiProviderAI } from '../services/multiProviderAI';

interface QuickCaptureProps {
  onCapture: (item: InfoItem) => void;
  onClose: () => void;
  aiProvider: AIProvider;
  theme: 'dark' | 'light';
}

interface ParsedResult {
  title: string;
  content: string;
  type: ItemType;
  tags: string[];
  priority: Priority;
  entities: ExtractedEntity[];
  confidence: number;
}

export function QuickCapture({ onCapture, onClose, aiProvider, theme }: QuickCaptureProps) {
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('internal');
  const [newTag, setNewTag] = useState('');

  const cardClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClasses = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300';

  // Parse raw input with AI
  const parseWithAI = useCallback(async () => {
    if (!rawInput.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await multiProviderAI.parseQuickCapture(rawInput, aiProvider);
      
      setParsedResult(result);
      setTitle(result.title);
      setContent(result.content || rawInput);
      setType(result.type);
      setTags(result.tags);
      setPriority(result.priority);
      setEditMode(true);
    } catch (error) {
      console.error('AI parsing failed:', error);
      // Fallback to basic parsing
      const lines = rawInput.split('\n');
      setTitle(lines[0].substring(0, 100));
      setContent(rawInput);
      setType('note');
      setTags([]);
      setPriority('medium');
      setEditMode(true);
    } finally {
      setIsProcessing(false);
    }
  }, [rawInput, aiProvider]);

  // Quick type detection based on content patterns
  const detectType = useCallback((text: string): ItemType => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('@') && lowerText.includes('.')) return 'contact';
    if (lowerText.includes('http://') || lowerText.includes('https://')) return 'link';
    if (lowerText.includes('todo:') || lowerText.includes('task:') || lowerText.includes('[]')) return 'task';
    if (lowerText.includes('idea:') || lowerText.includes('💡')) return 'idea';
    if (lowerText.includes('project:') || lowerText.includes('projekt:')) return 'project';
    if (lowerText.includes('person:') || lowerText.includes('navn:')) return 'person';
    return 'note';
  }, []);

  // Quick local parse (no AI)
  const quickParse = useCallback(() => {
    const lines = rawInput.split('\n').filter(l => l.trim());
    const detectedType = detectType(rawInput);
    
    // Extract potential tags (words starting with #)
    const hashTags = rawInput.match(/#\w+/g)?.map(t => t.substring(1)) || [];
    
    // Extract URLs
    const urls = rawInput.match(/https?:\/\/[^\s]+/g) || [];
    
    // Extract emails
    const emails = rawInput.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];

    setTitle(lines[0]?.substring(0, 100) || 'Ny note');
    setContent(rawInput);
    setType(detectedType);
    setTags(hashTags);
    setPriority('medium');
    setEditMode(true);
    
    setParsedResult({
      title: lines[0] || 'Ny note',
      content: rawInput,
      type: detectedType,
      tags: hashTags,
      priority: 'medium',
      entities: [
        ...urls.map(u => ({ type: 'url', value: u, confidence: 1 })),
        ...emails.map(e => ({ type: 'email', value: e, confidence: 1 })),
      ],
      confidence: 0.6,
    });
  }, [rawInput, detectType]);

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Submit the item
  const handleSubmit = () => {
    const item: InfoItem = {
      id: crypto.randomUUID(),
      type,
      title,
      content,
      tags,
      priority,
      status: 'active' as Status,
      securityLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: parsedResult ? { 
        aiParsed: true, 
        confidence: parsedResult.confidence,
        entities: parsedResult.entities,
      } : undefined,
    };
    onCapture(item);
  };

  // Paste handler
  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.length > 50) {
      // Auto-parse on large paste
      setRawInput(text);
      setTimeout(quickParse, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${cardClasses} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold">Quick Capture</h2>
            <span className={`text-xs px-2 py-1 rounded ${
              aiProvider === 'ollama' ? 'bg-green-900 text-green-300' :
              aiProvider === 'mistral' ? 'bg-blue-900 text-blue-300' :
              aiProvider === 'gemini' ? 'bg-purple-900 text-purple-300' :
              'bg-amber-900 text-amber-300'
            }`}>
              {aiProvider}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {!editMode ? (
            <>
              {/* Raw input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Indsæt eller skriv indhold
                </label>
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Indsæt tekst, URL, email, noter, idéer...&#10;&#10;Eksempler:&#10;- Mød John Smith john@example.com om projekt X&#10;- https://interessant-artikel.dk&#10;- #idé: Automatiser rapport-generering&#10;- TODO: Færdiggør dokumentation"
                  className={`w-full h-48 p-3 rounded-lg ${inputClasses} border resize-none focus:ring-2 focus:ring-cyan-500 outline-none`}
                  autoFocus
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={parseWithAI}
                  disabled={!rawInput.trim() || isProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      AI Analyserer...
                    </>
                  ) : (
                    <>
                      🧠 Parse med AI
                    </>
                  )}
                </button>
                <button
                  onClick={quickParse}
                  disabled={!rawInput.trim()}
                  className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  ⚡ Hurtig parse
                </button>
              </div>

              {/* Tips */}
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                <p>💡 <strong>Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Brug #tags for automatisk kategorisering</li>
                  <li>URLs og emails genkendes automatisk</li>
                  <li>Start med "TODO:" eller "IDEA:" for type-genkendelse</li>
                  <li>AI parsing giver bedst resultat for komplekse noter</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Parsed result - editable */}
              {parsedResult && (
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-cyan-900/30 border-cyan-800' : 'bg-cyan-50 border-cyan-200'} border`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-400">
                      ✓ Analyseret med {parsedResult.confidence * 100}% sikkerhed
                    </span>
                    <button
                      onClick={() => { setEditMode(false); setParsedResult(null); }}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      Start forfra
                    </button>
                  </div>
                  {parsedResult.entities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {parsedResult.entities.map((entity, i) => (
                        <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {entity.type}: {entity.value.substring(0, 30)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${inputClasses} border focus:ring-2 focus:ring-cyan-500 outline-none`}
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ItemType)}
                    className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                  >
                    <option value="note">📝 Note</option>
                    <option value="task">✅ Task</option>
                    <option value="idea">💡 Idé</option>
                    <option value="project">📁 Projekt</option>
                    <option value="person">👤 Person</option>
                    <option value="contact">📇 Kontakt</option>
                    <option value="link">🔗 Link</option>
                    <option value="document">📄 Dokument</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioritet</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                  >
                    <option value="low">🟢 Lav</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 Høj</option>
                    <option value="critical">🔴 Kritisk</option>
                  </select>
                </div>
              </div>

              {/* Security Level */}
              <div>
                <label className="block text-sm font-medium mb-1">Sikkerhedsniveau</label>
                <select
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(e.target.value as SecurityLevel)}
                  className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                >
                  <option value="public">🟢 Public</option>
                  <option value="internal">🔵 Internal</option>
                  <option value="confidential">🟠 Confidential</option>
                  <option value="restricted">🔴 Restricted</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-1">Indhold</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full h-24 p-3 rounded-lg ${inputClasses} border resize-none`}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-cyan-900 text-cyan-300 px-2 py-1 rounded flex items-center gap-1"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Tilføj tag..."
                    className={`flex-1 px-3 py-2 rounded-lg ${inputClasses} border`}
                  />
                  <button onClick={addTag} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {editMode && (
          <div className="p-4 border-t border-gray-700 flex gap-3">
            <button
              onClick={() => { setEditMode(false); setParsedResult(null); }}
              className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              ← Tilbage
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              ✓ Gem til InfoVault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
