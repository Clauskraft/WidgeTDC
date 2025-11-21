import React, { useState, useEffect, Fragment } from 'react';
import { X, Save } from 'lucide-react';
import { Dialog, Transition, Switch } from '@headlessui/react';
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-card border border-border rounded-xl shadow-[var(--shadow-hero)] w-full max-w-2xl max-h-[80vh] flex flex-col text-left">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <div>
                    <Dialog.Title as="h2" className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
                      <span>⚙️</span>
                      <span>Widget Configuration</span>
                    </Dialog.Title>
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
                        <Switch.Label className="text-sm font-semibold text-card-foreground block">
                          Show Widget Header
                        </Switch.Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Display widget title in header bar
                        </p>
                      </div>
                      <Switch
                        checked={config.showHeader ?? true}
                        onChange={(checked) => handleInputChange('showHeader', checked)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${(config.showHeader ?? true) ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <span className="sr-only">Show Widget Header</span>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${(config.showHeader ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                      </Switch>
                    </div>

                    {/* ... other settings ... */}

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default WidgetConfigModal;
