
import React, { useEffect } from 'react';
import { WidgetRegistryProvider, useWidgetRegistry } from './contexts/WidgetRegistryContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import Shell from './components/Shell';
import { WIDGET_DEFINITIONS } from './constants';

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

function App() {
  return (
    <GlobalStateProvider>
      <WidgetRegistryProvider>
        <WidgetInitializer />
        <Shell />
      </WidgetRegistryProvider>
    </GlobalStateProvider>
  );
}

export default App;
