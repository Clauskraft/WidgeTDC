import React, { useState } from 'react';
import { useWidgetRegistry, WidgetRegistryEntry } from '../contexts/WidgetRegistryContext';
import { WidgetCategory } from '../types';
import { X } from 'lucide-react';

interface WidgetManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  addWidget: (widgetType: string) => void;
}

const categoryDisplayNames: Record<WidgetCategory, string> = {
  'cybersecurity': '🛡️ Cybersecurity',
  'ai-agents': '🤖 AI Agents',
  'media-analysis': '🎨 Media Analysis',
  'productivity': '📋 Productivity',
  'development': '💻 Development',
  'business': '💼 Business',
  'communication': '💬 Communication',
  'system': '⚙️ System',
  'project-management': '📊 Project Management',
};

const WidgetManagementPanel: React.FC<WidgetManagementPanelProps> = ({ isOpen, onClose, addWidget }) => {
  const { availableWidgets, setEnabled } = useWidgetRegistry();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<WidgetCategory, typeof availableWidgets>);

  // Filter widgets by search term
  const filteredCategories = Object.entries(widgetsByCategory).reduce((acc, [category, widgets]) => {
    const filtered = (widgets as WidgetRegistryEntry[]).filter(widget =>
      widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category as WidgetCategory] = filtered;
    }
    return acc;
  }, {} as Record<WidgetCategory, typeof availableWidgets>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border shadow-[var(--shadow-hero)] z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">Widget Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enable, disable, and add widgets to your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-border bg-gradient-subtle">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-input text-foreground rounded-lg border border-border focus:border-ring focus:ring-2 focus:ring-ring/50 outline-none transition-all"
          />
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-subtle">
          <div className="space-y-6">
            {Object.entries(filteredCategories).map(([category, widgets]) => (
              <div key={category} className="animate-fade-in">
                <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  {categoryDisplayNames[category as WidgetCategory]}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({widgets.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="p-4 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-card-foreground">{widget.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {widget.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Enable/Disable Toggle */}
                          <button
                            onClick={() => setEnabled(widget.id, !widget.enabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${widget.enabled ? 'bg-primary' : 'bg-muted'
                              }`}
                          >
                            <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${widget.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                          </button>

                          {/* Add Widget Button */}
                          {widget.enabled && (
                            <button
                              onClick={() => {
                                addWidget(widget.id);
                                onClose();
                              }}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              Add to Dashboard
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(filteredCategories).length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">No widgets found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {availableWidgets.filter(w => w.enabled).length} of {availableWidgets.length} widgets enabled
            </div>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetManagementPanel;
