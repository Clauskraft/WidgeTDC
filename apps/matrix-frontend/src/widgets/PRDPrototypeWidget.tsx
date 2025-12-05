/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    PRD TO PROTOTYPE WIDGET - ENHANCED                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Transforms Product Requirements Documents into working HTML prototypes  ║
 * ║  Integrates with WidgetTDC's MCP infrastructure and Neo4j knowledge graph║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMCP } from '../contexts/MCPContext';
import { dataService } from '../services/UnifiedDataService';
import './PRDPrototypeWidget.css';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface VidensarkivFile {
  name: string;
  path: string;
  size: number;
}

interface SavedPrototype {
  id: string;
  name: string;
  createdAt: string;
  version?: number;
  prdId?: string;
}

type TabType = 'upload' | 'vidensarkiv' | 'history';
type GenerationStatus = 'idle' | 'loading' | 'generating' | 'complete' | 'error';
type StyleType = 'modern' | 'minimal' | 'corporate' | 'tdc-brand';

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const PRDPrototypeWidget: React.FC = () => {
  const { isConnected, callTool } = useMCP();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [prdContent, setPrdContent] = useState<string>('');
  const [prdName, setPrdName] = useState<string>('');
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [vidensarkivFiles, setVidensarkivFiles] = useState<VidensarkivFile[]>([]);
  const [savedPrototypes, setSavedPrototypes] = useState<SavedPrototype[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('modern');
  const [dragOver, setDragOver] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [selectedPrototypeId, setSelectedPrototypeId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(0);

  // ═══════════════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════════════

  const loadVidensarkivFiles = useCallback(async () => {
    try {
      if (isConnected) {
        const response = await callTool('list_vidensarkiv', { subfolder: 'PRDs' });
        if (response.success && response.data) {
          setVidensarkivFiles((response.data as { files: VidensarkivFile[] }).files || []);
        }
      } else {
        const files = await dataService.listVidensarkivFiles('PRDs');
        setVidensarkivFiles(files);
      }
    } catch (err) {
      console.error('Failed to load vidensarkiv files:', err);
    }
  }, [isConnected, callTool]);

  const loadSavedPrototypes = useCallback(async () => {
    try {
      const prototypes = await dataService.listPrototypes();
      setSavedPrototypes(prototypes);
    } catch (err) {
      console.error('Failed to load prototypes:', err);
    }
  }, []);

  useEffect(() => {
    loadVidensarkivFiles();
    loadSavedPrototypes();
  }, [loadVidensarkivFiles, loadSavedPrototypes]);

  // ═══════════════════════════════════════════════════════════════════════
  // File Handling
  // ═══════════════════════════════════════════════════════════════════════

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setPrdName(file.name.replace(/\.[^/.]+$/, ''));
    
    const validExtensions = ['.pdf', '.md', '.txt'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(ext)) {
      setError('Ugyldig filtype. Upload venligst PDF, Markdown (.md) eller TXT filer.');
      return;
    }

    try {
      if (ext === '.pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          setPrdContent(`[PDF:base64]${base64}`);
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        setPrdContent(text);
      }
    } catch (err) {
      setError(`Fejl ved læsning af fil: ${(err as Error).message}`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const selectVidensarkivFile = useCallback(async (filepath: string, filename: string) => {
    setStatus('loading');
    setError(null);
    setPrdName(filename.replace(/\.[^/.]+$/, ''));
    
    try {
      let content: string;
      if (isConnected) {
        const response = await callTool('read_vidensarkiv_file', { filepath });
        content = (response.data as { content: string }).content;
      } else {
        content = await dataService.readVidensarkivFile(filepath);
      }
      setPrdContent(content);
      setStatus('idle');
    } catch (err) {
      setError(`Fejl ved læsning af fil: ${(err as Error).message}`);
      setStatus('error');
    }
  }, [isConnected, callTool]);

  // ═══════════════════════════════════════════════════════════════════════
  // Prototype Generation
  // ═══════════════════════════════════════════════════════════════════════

  const generatePrototype = useCallback(async () => {
    if (!prdContent) {
      setError('Upload eller vælg venligst en PRD først');
      return;
    }

    setStatus('generating');
    setError(null);
    setGeneratedHtml('');
    setGenerationTime(null);
    startTimeRef.current = Date.now();

    try {
      const html = await dataService.generatePrototype(prdContent, {
        style: selectedStyle,
        locale: 'da-DK',
      });
      
      setGeneratedHtml(html);
      setStatus('complete');
      setGenerationTime(Date.now() - startTimeRef.current);
      
      // Render in iframe
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      }
    } catch (err) {
      setError(`Fejl ved generering: ${(err as Error).message}`);
      setStatus('error');
    }
  }, [prdContent, selectedStyle]);

  // ═══════════════════════════════════════════════════════════════════════
  // Prototype Management
  // ═══════════════════════════════════════════════════════════════════════

  const savePrototype = useCallback(async () => {
    if (!generatedHtml || !prdName) return;
    
    try {
      await dataService.savePrototype(prdName, generatedHtml);
      await loadSavedPrototypes();
      setError(null);
    } catch (err) {
      setError(`Fejl ved gem: ${(err as Error).message}`);
    }
  }, [generatedHtml, prdName, loadSavedPrototypes]);

  const loadSavedPrototype = useCallback(async (proto: SavedPrototype) => {
    setStatus('loading');
    setSelectedPrototypeId(proto.id);
    
    try {
      const data = await dataService.getPrototype(proto.id);
      if (data) {
        setGeneratedHtml(data.htmlContent);
        setPrdName(data.name);
        setStatus('complete');
        
        // Render in iframe
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(data.htmlContent);
            doc.close();
          }
        }
      }
    } catch (err) {
      setError(`Fejl ved indlæsning: ${(err as Error).message}`);
      setStatus('error');
    }
  }, []);

  const deletePrototype = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Er du sikker på at du vil slette denne prototype?')) return;
    
    try {
      await dataService.deletePrototype(id);
      await loadSavedPrototypes();
      if (selectedPrototypeId === id) {
        setGeneratedHtml('');
        setSelectedPrototypeId(null);
      }
    } catch (err) {
      setError(`Fejl ved sletning: ${(err as Error).message}`);
    }
  }, [selectedPrototypeId, loadSavedPrototypes]);

  const downloadPrototype = useCallback(() => {
    if (!generatedHtml) return;
    
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prdName || 'prototype'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedHtml, prdName]);

  const openInNewTab = useCallback(() => {
    if (!generatedHtml) return;
    
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [generatedHtml]);

  const clearPrd = useCallback(() => {
    setPrdContent('');
    setPrdName('');
    setGeneratedHtml('');
    setStatus('idle');
    setError(null);
    setSelectedPrototypeId(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="prd-widget">
      {/* Header */}
      <div className="prd-widget__header">
        <h2>PRD til Prototype</h2>
        <div className="prd-widget__connection">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'MCP Forbundet' : 'REST Mode'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="prd-widget__tabs">
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload
        </button>
        <button 
          className={`tab ${activeTab === 'vidensarkiv' ? 'active' : ''}`}
          onClick={() => setActiveTab('vidensarkiv')}
        >
          📚 Vidensarkiv
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Gemte ({savedPrototypes.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="prd-widget__content">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${prdContent ? 'has-content' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !prdContent && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              hidden
            />
            {prdContent ? (
              <div className="uploaded-file">
                <div className="file-preview">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <span className="file-name">{prdName}</span>
                    <span className="file-size">{(prdContent.length / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button className="clear-btn" onClick={(e) => { e.stopPropagation(); clearPrd(); }}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <p>Træk og slip din PRD her</p>
                <p className="upload-hint">eller klik for at vælge fil</p>
                <p className="upload-formats">PDF, Markdown, TXT</p>
              </>
            )}
          </div>
        )}

        {/* Vidensarkiv Tab */}
        {activeTab === 'vidensarkiv' && (
          <div className="vidensarkiv-list">
            {vidensarkivFiles.length === 0 ? (
              <p className="empty-state">Ingen PRD-filer fundet i Vidensarkiv/PRDs</p>
            ) : (
              vidensarkivFiles.map((file) => (
                <div
                  key={file.path}
                  className="file-item"
                  onClick={() => selectVidensarkivFile(file.path, file.name)}
                >
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))
            )}
            <button className="refresh-btn" onClick={loadVidensarkivFiles}>
              🔄 Opdater
            </button>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-list">
            {savedPrototypes.length === 0 ? (
              <p className="empty-state">Ingen gemte prototyper</p>
            ) : (
              savedPrototypes.map((proto) => (
                <div 
                  key={proto.id} 
                  className={`history-item ${selectedPrototypeId === proto.id ? 'selected' : ''}`}
                  onClick={() => loadSavedPrototype(proto)}
                >
                  <div className="proto-info">
                    <span className="proto-name">{proto.name}</span>
                    <span className="proto-meta">
                      {new Date(proto.createdAt).toLocaleDateString('da-DK')}
                      {proto.version && proto.version > 1 && ` • v${proto.version}`}
                    </span>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => deletePrototype(proto.id, e)}
                    title="Slet prototype"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Style Selector & Generate */}
      <div className="prd-widget__controls">
        <div className="style-selector">
          <label>Stil:</label>
          <select 
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value as StyleType)}
          >
            <option value="modern">🎨 Modern</option>
            <option value="minimal">✨ Minimal</option>
            <option value="corporate">🏢 Corporate</option>
            <option value="tdc-brand">💜 TDC Brand</option>
          </select>
        </div>
        
        <button
          className="generate-btn"
          onClick={generatePrototype}
          disabled={!prdContent || status === 'generating'}
        >
          {status === 'generating' ? (
            <>
              <span className="spinner" />
              Genererer...
            </>
          ) : (
            '🚀 Generer Prototype'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Preview Section */}
      {(status === 'generating' || generatedHtml) && (
        <div className="preview-section">
          <div className="preview-header">
            <div className="preview-title">
              <h3>Prototype Preview</h3>
              {generationTime && (
                <span className="generation-time">
                  Genereret på {(generationTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            {generatedHtml && (
              <div className="preview-actions">
                <button onClick={savePrototype} className="action-btn" title="Gem til database">
                  💾 Gem
                </button>
                <button onClick={openInNewTab} className="action-btn" title="Åbn i ny fane">
                  🔗 Åbn
                </button>
                <button onClick={downloadPrototype} className="action-btn" title="Download HTML">
                  ⬇️ Download
                </button>
              </div>
            )}
          </div>
          
          <div className="preview-container">
            {status === 'generating' ? (
              <div className="generating-indicator">
                <div className="pulse-ring" />
                <p>Genererer prototype...</p>
                <p className="hint">Dette kan tage op til 30 sekunder</p>
                <div className="progress-bar">
                  <div className="progress-fill" />
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title="Prototype Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PRDPrototypeWidget;
