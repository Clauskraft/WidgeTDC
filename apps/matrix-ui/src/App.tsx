/**
 * Matrix UI - WidgetTDC Frontend
 * PRD to Prototype Application
 */

import { MCPProvider } from './contexts/MCPContext';
import { PRDPrototypeWidget } from './widgets';
import './App.css';

function App() {
  return (
    <MCPProvider defaultUrl="ws://localhost:3001/mcp" autoConnect={true}>
      <div className="matrix-app">
        <header className="matrix-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Matrix UI</span>
          </div>
          <div className="header-subtitle">WidgetTDC Development Platform</div>
        </header>
        
        <main className="matrix-main">
          <div className="widget-container">
            <PRDPrototypeWidget />
          </div>
        </main>
        
        <footer className="matrix-footer">
          <span>Powered by WidgetTDC MCP Infrastructure</span>
          <span className="version">v1.0.0</span>
        </footer>
      </div>
    </MCPProvider>
  );
}

export default App;
