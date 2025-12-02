import React, { Suspense } from 'react';
import { Activity } from 'lucide-react';

interface ModuleGridProps {
  children: React.ReactNode;
}

export const ModuleGrid = ({ children }: ModuleGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 overflow-y-auto h-full">
      {children}
    </div>
  );
};

export const ModuleCard = ({ 
  title, 
  children, 
  colSpan = 1,
  rowSpan = 1
}: { 
  title: string; 
  children: React.ReactNode; 
  colSpan?: number; 
  rowSpan?: number; 
}) => {
  return (
    <div 
      className={`matrix-panel rounded-sm flex flex-col overflow-hidden h-full min-h-[300px]`}
      style={{ 
        gridColumn: `span ${colSpan}`, 
        gridRow: `span ${rowSpan}` 
      }}
    >
      <div className="p-3 border-b border-matrix-primary/20 flex items-center justify-between bg-matrix-crust/50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-matrix-primary"></div>
          <span className="text-xs font-sans text-matrix-primary uppercase tracking-wider font-bold">{title}</span>
        </div>
        <Activity className="w-3 h-3 text-matrix-dim animate-pulse" />
      </div>
      <div className="flex-1 relative bg-matrix-base/50 overflow-hidden p-2">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full w-full text-matrix-dim/30 text-xs font-mono animate-pulse">
            LOADING_MODULE...
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  );
};
