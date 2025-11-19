import React, { useState } from 'react';
import type {
  DataSource,
  Connection,
  FormField,
  ConnectionStatus,
  DataSourceCategory,
} from '../types';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';
import { Button } from '../components/ui/Button';

// --- Helper Components & Icons ---
const DatabaseIcon = (props: { className?: string }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 0116 0"
    />
  </svg>
);
const ApiIcon = (props: { className?: string }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
const FileIcon = (props: { className?: string }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);
const StatusIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const statusMap = {
    connected: { color: 'bg-green-500', text: 'Forbundet' },
    disconnected: { color: 'bg-gray-400', text: 'Afbrudt' },
    error: { color: 'bg-red-500', text: 'Fejl' },
    testing: { color: 'bg-yellow-500 animate-pulse', text: 'Tester...' },
  };
  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <div className={`w-2.5 h-2.5 rounded-full ${statusMap[status].color}`} />
      <span>{statusMap[status].text}</span>
    </div>
  );
};

// --- Data Definitions ---
const DATA_SOURCES: DataSource[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'Database',
    icon: DatabaseIcon,
    fields: [
      {
        name: 'host',
        label: 'Host',
        type: 'text',
        placeholder: 'f.eks. localhost',
        required: true,
      },
      { name: 'port', label: 'Port', type: 'number', placeholder: '5432', required: true },
      {
        name: 'database',
        label: 'Database',
        type: 'text',
        placeholder: 'mydatabase',
        required: true,
      },
      { name: 'user', label: 'Bruger', type: 'text', placeholder: 'admin', required: true },
      {
        name: 'password',
        label: 'Adgangskode',
        type: 'password',
        placeholder: '••••••••',
        required: true,
      },
    ],
  },
  {
    id: 'rest_api',
    name: 'REST API',
    category: 'API',
    icon: ApiIcon,
    fields: [
      {
        name: 'base_url',
        label: 'Base URL',
        type: 'text',
        placeholder: 'https://api.example.com',
        required: true,
      },
      {
        name: 'api_key',
        label: 'API Nøgle',
        type: 'password',
        placeholder: 'Indsæt din API nøgle',
        required: false,
      },
    ],
  },
  {
    id: 'csv_upload',
    name: 'CSV Fil',
    category: 'File',
    icon: FileIcon,
    fields: [
      {
        name: 'file_path',
        label: 'Filsti',
        type: 'text',
        placeholder: '/path/to/your/file.csv',
        required: true,
      },
    ],
  },
];

type View = 'list' | 'select_source' | 'configure';

// --- Main Widget Component ---
const MCPConnectorWidget: React.FC<{ widgetId: string }> = () => {
  const [view, setView] = useState<View>('list');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSelectSource = (source: DataSource) => {
    setSelectedSource(source);
    setFormState({ name: `${source.name} Forbindelse` });
    setTestStatus('idle');
    setView('configure');
  };

  const handleBack = () => {
    setSelectedSource(null);
    setFormState({});
    setView(view === 'configure' ? 'select_source' : 'list');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simple mock validation
    const success = Math.random() > 0.3;
    setTestStatus(success ? 'success' : 'error');
  };

  const handleSaveConnection = () => {
    if (!selectedSource) return;
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      name: formState.name || 'Unavngiven Forbindelse',
      dataSourceId: selectedSource.id,
      status: 'connected',
      config: { ...formState },
    };
    setConnections(prev => [...prev, newConnection]);
    setView('list');
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  // --- Render Methods ---
  const renderListView = () => (
    <div className="space-y-3">
      <Button onClick={() => setView('select_source')} className="w-full">
        Opret Ny Forbindelse
      </Button>
      {connections.length > 0 ? (
        connections.map(conn => {
          const source = DATA_SOURCES.find(ds => ds.id === conn.dataSourceId);
          return (
            <div
              key={conn.id}
              className="p-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                {source && <source.icon className="w-6 h-6 text-gray-500" />}
                <div>
                  <p className="font-semibold">{conn.name}</p>
                  <StatusIndicator status={conn.status} />
                </div>
              </div>
              <button
                onClick={() => handleDeleteConnection(conn.id)}
                className="ms-icon-button ms-focusable w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                title="Slet forbindelse"
              >
                <MicrosoftIcons.Close />
              </button>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-500 py-4">Ingen forbindelser oprettet.</p>
      )}
    </div>
  );

  const renderSelectSourceView = () => (
    <div>
      <button onClick={handleBack} className="ms-focusable text-sm mb-4">
        &larr; Tilbage
      </button>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {DATA_SOURCES.map(source => (
          <div
            key={source.id}
            onClick={() => handleSelectSource(source)}
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') handleSelectSource(source);
            }}
            tabIndex={0}
            className="ms-focusable p-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
          >
            <source.icon className="w-10 h-10 text-gray-600 dark:text-gray-300" />
            <span className="font-semibold text-center">{source.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConfigureView = () => {
    if (!selectedSource) return null;
    const testBtnClasses = {
      idle: 'bg-gray-500 hover:bg-gray-600',
      testing: 'bg-yellow-500 cursor-wait',
      success: 'bg-green-500',
      error: 'bg-red-500',
    };
    const testBtnText = {
      idle: 'Test Forbindelse',
      testing: 'Tester...',
      success: 'Succes!',
      error: 'Fejl - Prøv igen',
    };

    return (
      <div className="space-y-4">
        <button onClick={handleBack} className="ms-focusable text-sm mb-2">
          &larr; Tilbage til valg
        </button>
        <div className="flex items-center gap-3">
          <selectedSource.icon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
          <h3 className="text-xl font-bold">Konfigurer {selectedSource.name}</h3>
        </div>
        <input
          type="text"
          name="name"
          value={formState.name || ''}
          onChange={handleFormChange}
          placeholder="Navn på forbindelse"
          className="ms-focusable w-full p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        />
        {selectedSource.fields.map(field => (
          <div key={field.name}>
            <label className="text-sm font-medium">
              {field.label}
              {field.required && '*'}
            </label>
            <input
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formState[field.name] || ''}
              onChange={handleFormChange}
              required={field.required}
              className="ms-focusable w-full mt-1 p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            variant="subtle"
            className={`flex-1 text-white ${testBtnClasses[testStatus]}`}
          >
            {testBtnText[testStatus]}
          </Button>
          <Button
            onClick={handleSaveConnection}
            disabled={testStatus !== 'success'}
            className="flex-1"
          >
            Gem Forbindelse
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full -m-4 p-4">
      {view === 'list' && renderListView()}
      {view === 'select_source' && renderSelectSourceView()}
      {view === 'configure' && renderConfigureView()}
    </div>
  );
};

export default MCPConnectorWidget;
