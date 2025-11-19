import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';

const SystemSettingsWidget: React.FC<{ widgetId: string }> = () => {
  const { state, setTheme, toggleReduceMotion } = useGlobalState();

  const Toggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }> = ({ label, description, checked, onChange }) => (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <button
          onClick={onChange}
          className={`ms-focusable relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
            checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 space-y-6">
        <Toggle
          label="Dark Mode"
          description="Skift mellem lyst og mørkt tema"
          checked={state.theme === 'dark'}
          onChange={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        />
        <Toggle
          label="Reducer bevægelse"
          description="Slå animationer og overgange fra"
          checked={state.reduceMotion}
          onChange={toggleReduceMotion}
        />
      </div>
    </div>
  );
};

export default SystemSettingsWidget;
