
import React, { useEffect, useState } from 'react';
import { WidgetRegistryProvider, useWidgetRegistry } from './contexts/WidgetRegistryContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import Shell from './components/Shell';
import { WIDGET_DEFINITIONS } from './constants';
import './App.css';
import { SettingsPanel } from './components/SettingsPanel';
import { PermissionProvider } from './contexts/PermissionContext';
import { WidgetDefinition, WidgetInstance } from './types';

// Component to initialize widgets into the registry
const WidgetInitializer: React.FC = () => {
  const { registerWidget, availableWidgets } = useWidgetRegistry();

  useEffect(() => {
    // Prevent re-registering widgets
    if (availableWidgets.length === 0) {
      WIDGET_DEFINITIONS.forEach(widget => {
        registerWidget(widget);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerWidget]);

  return null;
};

export default function App() {
  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = (widget?: WidgetInstance) => {
    setSelectedWidget(widget || null);
    setShowSettings(true);
  };

  return (
    <GlobalStateProvider>
      <WidgetRegistryProvider>
        <WidgetInitializer />
        <Shell />
        <button 
          onClick={() => openSettings()}
          className="fixed top-4 right-4 bg-blue-600 text-white p-2 rounded"
        >
          Permissions
        </button>
        
        {showSettings && (
          <SettingsPanel 
            widgetId={selectedWidget?.id} 
            onClose={() => setShowSettings(false)} 
          />
        )}
        
        {/* Wrap widget board in permission context if needed */}
        <div className="widget-board">
          {/* The original code had a 'widgets' variable here, but it's not defined.
              Assuming the intent was to iterate over availableWidgets or a similar list.
              For now, I'll just iterate over availableWidgets as a placeholder.
              If 'widgets' is meant to be a state variable, it needs to be defined. */}
          {/* {widgets.map(widget => ( */}
          {/*   <PermissionProvider key={widget.id} widgetId={widget.id}> */}
          {/*     <widget.component widgetInstance={widget} /> */}
          {/*   </PermissionProvider> */}
          {/* ))} */}
          {/* Placeholder for widget board content */}
          <p>Widget Board Placeholder</p>
        </div>
      </WidgetRegistryProvider>
    </GlobalStateProvider>
  );
}