import React, { useState, useMemo, Fragment } from 'react';
import { useWidgetRegistry, WidgetRegistryEntry } from '../contexts/WidgetRegistryContext';
import { WidgetCategory } from '../types';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { useWidgetStore } from './widgetStore';
import { X, Cpu } from 'lucide-react';
import { DataWeaverWizard } from './DataWeaverWizard';

interface WidgetManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

const WidgetManagementPanel: React.FC<WidgetManagementPanelProps> = ({ isOpen, onClose }) => {
  const { availableWidgets, setEnabled } = useWidgetRegistry();
  const addWidget = useWidgetStore((state) => state.addWidget);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataWeaverOpen, setIsDataWeaverOpen] = useState(false);

  // Memoize grouping widgets by category. This only re-runs if availableWidgets changes.
  const widgetsByCategory = useMemo(() => {
    return availableWidgets.reduce((acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    }, {} as Record<WidgetCategory, typeof availableWidgets>);
  }, [availableWidgets]);

  // Memoize filtering. This only re-runs if the grouped widgets or the search term changes.
  const filteredCategories = useMemo(() => {
    return Object.entries(widgetsByCategory).reduce((acc, [category, widgets]) => {
      const filtered = (widgets as WidgetRegistryEntry[]).filter(widget =>
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category as WidgetCategory] = filtered;
      }
      return acc;
    }, {} as Record<WidgetCategory, typeof availableWidgets>);
  }, [widgetsByCategory, searchTerm]);

  return (
    <>
      <DataWeaverWizard isOpen={isDataWeaverOpen} onClose={() => setIsDataWeaverOpen(false)} />
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                    <div className="flex h-full flex-col overflow-y-scroll bg-card shadow-xl">
                      {/* Header */}
                      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                          <div>
                            <Dialog.Title className="text-2xl font-semibold text-card-foreground">Widget Management</Dialog.Title>
                            <p className="text-sm text-muted-foreground mt-1">
                              Enable, disable, and add widgets to your dashboard
                            </p>
                          </div>
                          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4">
                          <button onClick={() => setIsDataWeaverOpen(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Opret Ny Widget fra Data (Data Weaver)
                          </button>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="p-6 border-b border-border bg-gradient-subtle">
                        <input type="text" placeholder="Search widgets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-input text-foreground rounded-lg border border-border focus:border-ring focus:ring-2 focus:ring-ring/50 outline-none transition-all" />
                      </div>

                      {/* Widget List */}
                      <div className="flex-1 overflow-y-auto p-6 bg-gradient-subtle">
                        <div className="space-y-6">
                          {Object.entries(filteredCategories).map(([category, widgets]) => (
                            <div key={category}>
                              <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                                {categoryDisplayNames[category as WidgetCategory]}
                                <span className="text-sm font-normal text-muted-foreground">({widgets.length})</span>
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                {widgets.map((widget) => (
                                  <div key={widget.id} className="p-4 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-card)]">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-card-foreground">{widget.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{widget.id}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Switch checked={widget.enabled} onChange={(checked) => setEnabled(widget.id, checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${widget.enabled ? 'bg-primary' : 'bg-muted'}`}>
                                          <span className="sr-only">Enable {widget.name}</span>
                                          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${widget.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </Switch>
                                        {widget.enabled && (
                                          <button onClick={() => { addWidget(widget.id); onClose(); }} className="btn-primary text-sm px-3 py-1">
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
                          {Object.keys(filteredCategories).length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-10">
                              <p className="text-muted-foreground">No widgets found matching "{searchTerm}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5 sticky bottom-0">
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
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default WidgetManagementPanel;
