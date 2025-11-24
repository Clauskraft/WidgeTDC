import React from 'react';
import type { MSWidget } from '../types';

interface MSWidgetRendererProps {
  widget: MSWidget;
  widgetId: string;
}

// A simple helper component for key-value pairs
const InfoItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</h4>
        <div className="text-gray-800 dark:text-gray-200">{children}</div>
    </div>
);


export const MSWidgetRenderer: React.FC<MSWidgetRendererProps> = ({
  widget,
}) => {
  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">{widget.displayName}</h3>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Microsoft
        </span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-sm">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Size">
                <p className="capitalize">{widget.size || 'Ukendt'}</p>
            </InfoItem>
            {widget.detectionSource && (
                <InfoItem label="Detection Source">
                    <p className="capitalize">{widget.detectionSource}</p>
                </InfoItem>
            )}
            <InfoItem label="Widget ID">
                <p className="font-mono text-xs break-all">{widget.id}</p>
            </InfoItem>
        </div>

        {widget.dataSource?.url && (
            <InfoItem label="Data Source">
                <a href={widget.dataSource.url} target="_blank" rel="noopener noreferrer" className="ms-focusable text-blue-500 hover:underline break-all">
                {widget.dataSource.url}
                </a>
            </InfoItem>
        )}

        <InfoItem label="Capabilities">
            <div className="flex flex-wrap gap-2">
                {widget.capabilities.length > 0 ? widget.capabilities.map(cap => (
                <span key={cap} className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 capitalize">
                    {cap}
                </span>
                )) : <span className="text-xs italic text-gray-500">Ingen specificeret</span>}
            </div>
        </InfoItem>
        
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Template Preview</h4>
          <pre className="p-3 text-xs bg-gray-100 dark:bg-gray-900 rounded-md overflow-x-auto max-h-40 border border-gray-200 dark:border-gray-700">
            <code>{JSON.stringify(widget.template, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
