import React, { useState, useEffect, useCallback } from 'react';
import { InfoItem, InfoGroup, AIProvider, WidgetTDCStatus, GraphData } from './types';
import { GraphVisualization } from './components/GraphVisualization';
import { QuickCapture } from './components/QuickCapture';
import { AgentDelegation } from './components/AgentDelegation';
import { widgetTDCClient } from './services/widgetTDCClient';
import { multiProviderAI } from './services/multiProviderAI';

// Default groups
const defaultGroups: InfoGroup[] = [
  { id: 'projects', name: 'Projekter', color: 'cyan', itemCount: 0 },
  { id: 'people', name: 'Personer', color: 'purple', itemCount: 0 },
  { id: 'ideas', name: 'Idéer', color: 'amber', itemCount: 0 },
  { id: 'docs', name: 'Dokumenter', color: 'emerald', itemCount: 0 },
];

export default function App() {
  // State
  const [items, setItems] = useState<InfoItem[]>([]);
  const [groups, setGroups] = useState<InfoGroup[]>(defaultGroups);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InfoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'grid' | 'list' | 'graph'>('grid');
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama');
  const [widgetTDCStatus, setWidgetTDCStatus] = useState<WidgetTDCStatus>({
    connected: false,
    neo4jConnected: false,
    agentsAvailable: [],
    nodeCount: 0,
    relationshipCount: 0,
  });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadFromStorage();
    checkWidgetTDCConnection();
  }, []);

  // Storage functions
  const loadFromStorage = () => {
    const savedItems = localStorage.getItem('infovault_items');
    const savedGroups = localStorage.getItem('infovault_groups');
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedGroups) setGroups(JSON.parse(savedGroups));
  };

  const saveToStorage = useCallback((newItems: InfoItem[], newGroups: InfoGroup[]) => {
    localStorage.setItem('infovault_items', JSON.stringify(newItems));
    localStorage.setItem('infovault_groups', JSON.stringify(newGroups));
  }, []);

  // WidgetTDC connection check
  const checkWidgetTDCConnection = async () => {
    try {
      const status = await widgetTDCClient.getStatus();
      setWidgetTDCStatus(status);
      if (status.neo4jConnected) {
        loadGraphData();
      }
    } catch {
      setWidgetTDCStatus(prev => ({ ...prev, connected: false }));
    }
  };

  // Load graph data from Neo4j
  const loadGraphData = async () => {
    try {
      const data = await widgetTDCClient.getGraphData();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesGroup = !selectedGroup || item.groupId === selectedGroup;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  // CRUD operations
  const addItem = async (item: Omit<InfoItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InfoItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newItems = [...items, newItem];
    setItems(newItems);
    
    // Update group count
    if (item.groupId) {
      const newGroups = groups.map(g => 
        g.id === item.groupId ? { ...g, itemCount: g.itemCount + 1 } : g
      );
      setGroups(newGroups);
      saveToStorage(newItems, newGroups);
    } else {
      saveToStorage(newItems, groups);
    }

    // Sync to Neo4j if connected
    if (widgetTDCStatus.neo4jConnected) {
      try {
        await widgetTDCClient.createInfoItem(newItem);
        loadGraphData();
      } catch (error) {
        console.error('Failed to sync to Neo4j:', error);
      }
    }
  };

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    
    if (item?.groupId) {
      const newGroups = groups.map(g => 
        g.id === item.groupId ? { ...g, itemCount: Math.max(0, g.itemCount - 1) } : g
      );
      setGroups(newGroups);
      saveToStorage(newItems, newGroups);
    } else {
      saveToStorage(newItems, groups);
    }

    if (widgetTDCStatus.neo4jConnected && item?.neo4jId) {
      await widgetTDCClient.deleteInfoItem(item.neo4jId);
      loadGraphData();
    }
  };

  // AI Analysis
  const analyzeItem = async (item: InfoItem) => {
    setIsLoading(true);
    try {
      const result = await multiProviderAI.analyze(item.content, aiProvider);
      setSelectedItem({ ...item, metadata: { ...item.metadata, aiAnalysis: result } });
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick capture handler
  const handleQuickCapture = async (result: InfoItem) => {
    await addItem(result);
    setShowQuickCapture(false);
  };

  // Agent delegation handler
  const handleAgentTask = async (task: { description: string; agent: string }) => {
    try {
      await widgetTDCClient.routeTask(task.description, task.agent);
    } catch (error) {
      console.error('Agent task failed:', error);
    }
  };

  // Theme classes
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-gray-100' 
    : 'bg-gray-50 text-gray-900';

  const cardClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${cardClasses} border-b px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            InfoVault
          </h1>
          <span className="text-sm text-gray-500">
            {widgetTDCStatus.connected ? (
              <span className="text-green-400">● WidgetTDC</span>
            ) : (
              <span className="text-gray-500">○ Offline</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Søg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 rounded-lg ${cardClasses} border focus:ring-2 focus:ring-cyan-500 outline-none`}
          />

          {/* View toggles */}
          <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
            {(['grid', 'list', 'graph'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded ${view === v ? 'bg-cyan-600' : 'hover:bg-gray-600'}`}
              >
                {v === 'grid' ? '▦' : v === 'list' ? '☰' : '◉'}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <button
            onClick={() => setShowQuickCapture(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:opacity-90"
          >
            ⚡ Quick Capture
          </button>

          <button
            onClick={() => setShowAgentPanel(true)}
            className="px-4 py-2 bg-amber-600 rounded-lg hover:opacity-90"
            disabled={!widgetTDCStatus.connected}
          >
            🤖 Agents
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-700"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-700"
          >
            ⚙️
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className={`w-64 ${cardClasses} border-r p-4`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Grupper</h2>
            <button
              onClick={() => setSelectedGroup(null)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${
                !selectedGroup ? 'bg-cyan-600' : 'hover:bg-gray-700'
              }`}
            >
              Alle ({items.length})
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center justify-between ${
                  selectedGroup === group.id ? 'bg-cyan-600' : 'hover:bg-gray-700'
                }`}
              >
                <span className={`text-${group.color}-400`}>● {group.name}</span>
                <span className="text-sm text-gray-500">{group.itemCount}</span>
              </button>
            ))}
          </div>

          {/* WidgetTDC Status */}
          {widgetTDCStatus.connected && (
            <div className="border-t border-gray-700 pt-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Neo4j Graph</h2>
              <div className="text-sm space-y-1">
                <p>Noder: {widgetTDCStatus.nodeCount}</p>
                <p>Relationer: {widgetTDCStatus.relationshipCount}</p>
                <p className="text-green-400">
                  Agents: {widgetTDCStatus.agentsAvailable.join(', ')}
                </p>
              </div>
              <button
                onClick={loadGraphData}
                className="mt-2 w-full px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
              >
                🔄 Opdater graf
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {view === 'graph' ? (
            <GraphVisualization
              data={graphData}
              theme={theme}
              onNodeClick={(node) => {
                const item = items.find(i => i.neo4jId === node.id || i.id === node.id);
                if (item) setSelectedItem(item);
              }}
            />
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`${cardClasses} border rounded-lg p-4 cursor-pointer hover:border-cyan-500 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.priority === 'critical' ? 'bg-red-600' :
                      item.priority === 'high' ? 'bg-orange-600' :
                      item.priority === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>{item.type}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      item.securityLevel === 'restricted' ? 'bg-red-900 text-red-300' :
                      item.securityLevel === 'confidential' ? 'bg-orange-900 text-orange-300' :
                      item.securityLevel === 'internal' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                    }`}>
                      {item.securityLevel}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add new item card */}
              <button
                onClick={() => setShowQuickCapture(true)}
                className={`${cardClasses} border border-dashed rounded-lg p-8 flex flex-col items-center justify-center hover:border-cyan-500 transition-colors`}
              >
                <span className="text-4xl mb-2">+</span>
                <span>Tilføj ny</span>
              </button>
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selectedItem && (
          <aside className={`w-96 ${cardClasses} border-l p-6 overflow-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Type</label>
                <p className="capitalize">{selectedItem.type}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Indhold</label>
                <p className="whitespace-pre-wrap">{selectedItem.content}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Tags</label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {selectedItem.tags.map(tag => (
                    <span key={tag} className="bg-gray-700 px-2 py-1 rounded text-sm">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Prioritet</label>
                  <p className="capitalize">{selectedItem.priority}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="capitalize">{selectedItem.status}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Sikkerhedsniveau</label>
                <p className="capitalize">{selectedItem.securityLevel}</p>
              </div>

              {/* AI Analysis button */}
              <button
                onClick={() => analyzeItem(selectedItem)}
                disabled={isLoading}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? '⏳ Analyserer...' : '🧠 AI Analyse'}
              </button>

              {/* Show AI analysis results */}
              {selectedItem.metadata?.aiAnalysis && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">AI Analyse</h3>
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.metadata.aiAnalysis, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => deleteItem(selectedItem.id)}
                  className="flex-1 py-2 bg-red-600 rounded-lg hover:bg-red-700"
                >
                  🗑️ Slet
                </button>
                {widgetTDCStatus.connected && (
                  <button
                    onClick={() => {
                      setShowAgentPanel(true);
                    }}
                    className="flex-1 py-2 bg-amber-600 rounded-lg hover:bg-amber-700"
                  >
                    🤖 Send til Agent
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Quick Capture Modal */}
      {showQuickCapture && (
        <QuickCapture
          onCapture={handleQuickCapture}
          onClose={() => setShowQuickCapture(false)}
          aiProvider={aiProvider}
          theme={theme}
        />
      )}

      {/* Agent Delegation Panel */}
      {showAgentPanel && (
        <AgentDelegation
          onDelegate={handleAgentTask}
          onClose={() => setShowAgentPanel(false)}
          agents={widgetTDCStatus.agentsAvailable}
          selectedItem={selectedItem}
          theme={theme}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClasses} rounded-xl p-6 w-full max-w-md`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Indstillinger</h2>
              <button onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                >
                  <option value="ollama">Ollama (Lokal)</option>
                  <option value="mistral">Mistral (EU/GDPR)</option>
                  <option value="gemini">Gemini (Google)</option>
                  <option value="deepseek">DeepSeek (Hurtig)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">WidgetTDC Backend</label>
                <input
                  type="text"
                  defaultValue="http://localhost:3002"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Status: {widgetTDCStatus.connected ? '✅ Forbundet' : '❌ Ikke forbundet'}
                </p>
              </div>

              <button
                onClick={checkWidgetTDCConnection}
                className="w-full py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700"
              >
                🔄 Test forbindelse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
