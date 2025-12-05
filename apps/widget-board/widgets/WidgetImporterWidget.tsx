import React, { useState } from 'react';
import { MSWidgetAdapter } from '../adapters/MSWidgetAdapter';
import type { MSWidget } from '../types';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { Button } from '../components/ui/Button';
import { MSWidgetDetector } from '../detectors/MSWidgetDetector';

const exampleMSWidget: MSWidget = {
  id: "SalesTracker-v1",
  displayName: "Kvartalsvis Salg",
  template: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: "Salgs-dashboard",
        weight: "Bolder",
        size: "Medium"
      }
    ]
  },
  dataSource: {
    url: "https://api.contoso.com/sales/quarterly"
  },
  capabilities: ["interactive", "data-driven"]
};

type View = 'importer' | 'detector';

const WidgetImporterWidget: React.FC<{ widgetId: string }> = () => {
  const { registerWidget, availableWidgets } = useWidgetRegistry();
  const [view, setView] = useState<View>('importer');

  // State for manual importer
  const [inputJson, setInputJson] = useState(JSON.stringify(exampleMSWidget, null, 2));
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // State for auto-detector
  const [isScanning, setIsScanning] = useState(false);
  const [detectedWidgets, setDetectedWidgets] = useState<MSWidget[]>([]);
  const [scanError, setScanError] = useState('');

  const handleManualImport = () => {
    try {
      setImportError('');
      setImportSuccess('');
      const msWidget: MSWidget = JSON.parse(inputJson);

      if (!msWidget.id || !msWidget.displayName || !msWidget.template) {
        throw new Error("Ugyldigt JSON format. 'id', 'displayName', og 'template' er påkrævet.");
      }

      handleDirectImport(msWidget, (successMsg) => {
        setImportSuccess(successMsg);
      });

    } catch (e: any) {
      setImportError(`Fejl ved transformation: ${e.message}`);
    }
  };

  const handleDirectImport = (msWidget: MSWidget, onSuccess: (message: string) => void) => {
    const adapter = new MSWidgetAdapter();
    const newWidgetDefinition = adapter.transformToWidgetDefinition(msWidget);

    if (availableWidgets.some(w => w.id === newWidgetDefinition.id)) {
      onSuccess(`Widget'en "${newWidgetDefinition.name}" er allerede importeret.`);
      return;
    }

    // Convert WidgetDefinition to WidgetEntry by wrapping component in lazy
    const LazyComponent = React.lazy(() => Promise.resolve({
      default: newWidgetDefinition.component as React.ComponentType<{ widgetId: string; config?: any }>
    }));

    registerWidget?.({
      id: newWidgetDefinition.id,
      name: newWidgetDefinition.name,
      description: newWidgetDefinition.description,
      category: newWidgetDefinition.category,
      component: LazyComponent,
      defaultLayout: newWidgetDefinition.defaultLayout,
    });
    onSuccess(`Widget'en "${newWidgetDefinition.name}" er blevet tilføjet til sidebaren og er klar til brug.`);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanError('');
    setDetectedWidgets([]);
    try {
      const results = await MSWidgetDetector.detectInstalledWidgets();
      const allWidgets: MSWidget[] = results.flatMap(result =>
        result.widgets.map(widget => ({
          ...widget,
          detectionSource: result.source,
        }))
      );
      if (allWidgets.length === 0) {
        setScanError("Ingen widgets fundet på systemet.");
      } else {
        setDetectedWidgets(allWidgets);
      }
    } catch (e: any) {
      setScanError('Kunne ikke scanne efter widgets. Denne funktion er muligvis kun tilgængelig i en desktop-app.');
    } finally {
      setIsScanning(false);
    }
  };

  const renderManualImporter = () => (
    <>
      <div className="flex flex-col gap-2 flex-1">
        <label htmlFor="ms-widget-json" className="font-semibold">Indsæt Microsoft Widget JSON</label>
        <textarea
          id="ms-widget-json"
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          className="ms-focusable w-full flex-1 p-2 rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 resize-none font-mono text-xs"
        />
      </div>
      {(importError || importSuccess) && (
        <div className="pt-2">
          {importError && <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">{importError}</div>}
          {importSuccess && (
            <div className="p-3 text-sm rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
              <p className="font-bold">Success!</p>
              <p>{importSuccess}</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderAutoDetector = () => (
    <div className="flex flex-col gap-4">
      <Button onClick={handleScan} disabled={isScanning}>
        {isScanning ? 'Scanner...' : 'Scan efter Installerede Widgets'}
      </Button>
      {scanError && <p className="text-red-500 text-sm text-center">{scanError}</p>}
      {detectedWidgets.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Fundne Widgets:</h4>
          {detectedWidgets.map(widget => {
            const adapter = new MSWidgetAdapter();
            const definition = adapter.transformToWidgetDefinition(widget);
            const isImported = availableWidgets.some(w => w.id === definition.id);

            return (
              <div key={widget.id} className="p-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium">{widget.displayName}</p>
                  {widget.detectionSource && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fundet i: {widget.detectionSource}
                    </p>
                  )}
                </div>
                <Button
                  size="small"
                  disabled={isImported}
                  onClick={() => handleDirectImport(widget, (msg) => alert(msg))}
                >
                  {isImported ? 'Importeret' : 'Importér'}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('importer')}
            className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${view === 'importer' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
          >
            Manuel Import
          </button>
          <button
            onClick={() => setView('detector')}
            className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${view === 'detector' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
          >
            Auto-detektér
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {view === 'importer' ? renderManualImporter() : renderAutoDetector()}
      </div>

      {view === 'importer' && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleManualImport} className="w-full">
            Importér og Registrér Widget
          </Button>
        </div>
      )}
    </div>
  );
};

export default WidgetImporterWidget;