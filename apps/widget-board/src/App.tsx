import React, { Suspense, useState } from 'react';
import { MainLayout } from './components/MainLayout';
import { AppLauncher } from './components/GroupedAppLauncher';
import { WidgetRegistryProvider } from './contexts/WidgetRegistryContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { staticWidgetRegistry } from './staticWidgetRegistry';
import { ArrowLeft } from 'lucide-react';
import './App.css';
import { PlatformProvider } from './platform/core/PlatformProvider.tsx';

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
  const [launchedWidgetId, setLaunchedWidgetId] = useState<string | null>(null);

  const handleLaunch = (widgetId: string) => {
    console.log('Launching widget:', widgetId);
    setLaunchedWidgetId(widgetId);
  };

  const WidgetComponent = launchedWidgetId ? staticWidgetRegistry[launchedWidgetId] : null;

  return (
    <PlatformProvider>
      <GlobalStateProvider>
        <Suspense fallback={<AppLoader />}>
          <WidgetRegistryProvider>
            <MainLayout headerActions={launchedWidgetId ? (
                <button 
                    onClick={() => setLaunchedWidgetId(null)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B3E6F]/40 hover:bg-[#0B3E6F]/60 text-sm text-white transition-all border border-white/10 hover:border-[#00B5CB]/30 shadow-lg hover:shadow-[#00B5CB]/20 active:scale-95"
                >
                    <ArrowLeft size={16} className="text-[#00B5CB]" />
                    <span className="font-medium">Tilbage</span>
                </button>
            ) : null}>
              {launchedWidgetId && WidgetComponent ? (
                  <div className="h-full flex flex-col animate-fade-in relative pb-2">
                      <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#051e3c]/50 backdrop-blur-xl shadow-2xl relative flex flex-col">
                          <Suspense fallback={
                              <div className="flex items-center justify-center h-full flex-col gap-4">
                                  <div className="w-12 h-12 border-4 border-[#00B5CB]/30 border-t-[#00B5CB] rounded-full animate-spin"></div>
                                  <div className="text-[#00B5CB] font-mono text-sm tracking-widest animate-pulse">INITIALIZING NEURAL LINK...</div>
                              </div>
                          }>
                              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                                  <WidgetComponent widgetId={launchedWidgetId} isMaximized={true} />
                              </div>
                          </Suspense>
                      </div>
                  </div>
              ) : (
                  <AppLauncher onLaunch={handleLaunch} />
              )}
            </MainLayout>
          </WidgetRegistryProvider>
        </Suspense>
      </GlobalStateProvider>
    </PlatformProvider>
  );
}
