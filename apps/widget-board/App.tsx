import React, { Suspense } from 'react';
import MatrixFigmaLayout from './src/components/layouts/MatrixFigmaLayout';
import { WidgetRegistryProvider } from './contexts/WidgetRegistryContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import './App.css';
import { PlatformProvider } from './src/platform/core/PlatformProvider.tsx';

// Loading fallback
const AppLoader = () => (
  <div className="w-full h-screen flex items-center justify-center bg-[#020617]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <div className="font-mono text-emerald-500 animate-pulse tracking-widest">INITIALIZING SYSTEM...</div>
    </div>
  </div>
);

export default function App() {
  return (
    <PlatformProvider>
      <GlobalStateProvider>
        <Suspense fallback={<AppLoader />}>
          <WidgetRegistryProvider>
            <MatrixFigmaLayout />
          </WidgetRegistryProvider>
        </Suspense>
      </GlobalStateProvider>
    </PlatformProvider>
  );
}