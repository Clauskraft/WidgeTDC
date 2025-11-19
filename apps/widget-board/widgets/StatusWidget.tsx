import React from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

const StatusWidget: React.FC<{ widgetId: string }> = () => {
  const { availableWidgets } = useWidgetRegistry();
  const { state } = useGlobalState();

  const StatusItem: React.FC<{
    label: string;
    value: string | number;
    status?: 'success' | 'warning' | 'info';
  }> = ({ label, value, status = 'info' }) => {
    const statusColors = {
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
    };

    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`text-sm font-medium ${statusColors[status]}`}>{value}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="text-lg font-semibold">System Status</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-1">
          <StatusItem label="Application" value="WidgetBoard" status="success" />
          <StatusItem label="Version" value="0.0.0" status="info" />
          <StatusItem label="Theme" value={state.theme === 'dark' ? 'Mørk' : 'Lys'} status="info" />
          <StatusItem
            label="Tilgængelige widgets"
            value={availableWidgets.length}
            status={availableWidgets.length > 0 ? 'success' : 'warning'}
          />
          <StatusItem
            label="Reducer bevægelse"
            value={state.reduceMotion ? 'Aktiveret' : 'Deaktiveret'}
            status="info"
          />
          <StatusItem label="Status" value="Kørende" status="success" />
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
          Sidst opdateret: {new Date().toLocaleString('da-DK')}
        </div>
      </div>
    </div>
  );
};

export default StatusWidget;
