import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { WidgetConfig } from '../types';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string;
  widgetName: string;
  initialConfig?: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
}

const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  widgetId,
  widgetName,
  initialConfig = {},
  onSave,
}) => {
  const [config, setConfig] = useState<WidgetConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleInputChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-card border border-border rounded-xl shadow-[var(--shadow-hero)] w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
                <span>⚙️</span>
                <span>Widget Configuration</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure settings for: {widgetName}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-subtle">
            <div className="space-y-6">
              {/* Refresh Interval */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-card-foreground">
                  Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.refreshInterval ?? 30}
                  onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-input text-foreground rounded-lg border border-border focus:border-ring focus:ring-2 focus:ring-ring/50 outline-none transition-all"
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 to disable auto-refresh
                </p>
              </div>

              {/* Show Header */}
              <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg">
                <div>
                  <label className="text-sm font-semibold text-card-foreground block">
                    Show Widget Header
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Display widget title in header bar
                  </p>
                </div>
                <button
                  onClick={() => handleInputChange('showHeader', !(config.showHeader ?? true))}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    (config.showHeader ?? true) ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      (config.showHeader ?? true) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg">
                <div>
                  <label className="text-sm font-semibold text-card-foreground block">
                    Compact Mode
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reduce padding and spacing for denser display
                  </p>
                </div>
                <button
                  onClick={() => handleInputChange('compactMode', !(config.compactMode ?? false))}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    (config.compactMode ?? false) ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      (config.compactMode ?? false) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Borders */}
              <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg">
                <div>
                  <label className="text-sm font-semibold text-card-foreground block">
                    Show Borders
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Display borders around widget content
                  </p>
                </div>
                <button
                  onClick={() => handleInputChange('showBorders', !(config.showBorders ?? true))}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    (config.showBorders ?? true) ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      (config.showBorders ?? true) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-card-foreground">
                  Custom Notes
                </label>
                <textarea
                  value={config.notes ?? ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-input text-foreground rounded-lg border border-border focus:border-ring focus:ring-2 focus:ring-ring/50 outline-none transition-all resize-none"
                  placeholder="Add custom notes for this widget..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Personal notes visible only to you
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-primary/10 backdrop-blur border border-primary/30 rounded-lg">
                <p className="text-sm text-card-foreground">
                  💡 <strong>Tip:</strong> Widget-specific settings will be saved automatically and persist across sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5 flex gap-3 justify-end">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetConfigModal;
