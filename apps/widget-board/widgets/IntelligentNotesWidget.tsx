import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useMCP } from '../src/hooks/useMCP';
import { Plus, Search, Save, Trash2, FileText, RefreshCw, Tag, Shield } from 'lucide-react';

interface NoteRecord {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
  owner: string;
  compliance: 'clean' | 'review' | 'restricted';
  riskScore: number;
  source?: string;
}

const IntelligentNotesWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { send } = useMCP();
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<NoteRecord>>({});

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await send('agent-orchestrator', 'notes.list', {});
      if (response && response.notes) {
        setNotes(response.notes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      // Fallback if backend is offline
      setNotes([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async () => {
    if (!currentNote.title) return;
    
    try {
      if (currentNote.id) {
        // Update
        await send('agent-orchestrator', 'notes.update', {
          id: currentNote.id,
          title: currentNote.title,
          content: currentNote.body,
          tags: currentNote.tags
        });
      } else {
        // Create
        await send('agent-orchestrator', 'notes.create', {
          title: currentNote.title,
          content: currentNote.body,
          tags: currentNote.tags
        });
      }
      setIsEditing(false);
      setCurrentNote({});
      fetchNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker?')) return;
    try {
      await send('agent-orchestrator', 'notes.delete', { id });
      fetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [notes, searchQuery]);

  if (isEditing) {
    return (
      <div className="h-full flex flex-col p-4 bg-[#0B3E6F]/20">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{currentNote.id ? 'Rediger Note' : 'Ny Note'}</h3>
          <div className="flex gap-2">
            <Button variant="subtle" size="small" onClick={() => setIsEditing(false)}>Annuller</Button>
            <Button variant="primary" size="small" onClick={handleSave}><Save size={14} className="mr-1"/> Gem</Button>
          </div>
        </div>
        <input
          className="bg-black/20 border border-white/10 rounded-lg p-2 mb-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00B5CB]"
          placeholder="Titel"
          value={currentNote.title || ''}
          onChange={e => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 mb-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00B5CB] resize-none font-mono text-sm"
          placeholder="Skriv dine tanker..."
          value={currentNote.body || ''}
          onChange={e => setCurrentNote(prev => ({ ...prev, body: e.target.value }))}
        />
        <input
          className="bg-black/20 border border-white/10 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00B5CB] text-sm"
          placeholder="Tags (komma separeret)"
          value={currentNote.tags?.join(', ') || ''}
          onChange={e => setCurrentNote(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="intelligent-notes-widget">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText size={18} /> Noter
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={fetchNotes} 
            className={`p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => { setCurrentNote({}); setIsEditing(true); }}
            className="px-3 py-1.5 bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Ny
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input 
          type="text" 
          placeholder="Søg i noter..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => { setCurrentNote(note); setIsEditing(true); }}
              className="p-3 bg-[#0B3E6F]/20 hover:bg-[#0B3E6F]/40 border border-white/5 hover:border-[#00B5CB]/30 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-gray-200 group-hover:text-white truncate pr-2">{note.title}</h4>
                {note.compliance !== 'clean' && <Shield size={12} className="text-amber-400 shrink-0" />}
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 mb-2">{note.body}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {note.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400 flex items-center gap-1">
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                  className="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-xs">
            {isLoading ? 'Indlæser...' : 'Ingen noter fundet'}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentNotesWidget;
