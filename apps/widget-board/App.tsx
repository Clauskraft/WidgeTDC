import React, { Suspense } from 'react';
import WidgeTDCPro from './WidgeTDC_Pro';
import './App.css';

// Loading fallback
const AppLoader = () => (
  <div className="w-full h-screen flex items-center justify-center bg-[#050505]">
    <div className="text-slate-200 text-center">
      <div className="text-4xl mb-4">🚀</div>
      <p>Initializing WidgeTDC Pro...</p>
      <div className="mt-4 flex gap-1 justify-center">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<AppLoader />}>
      <WidgeTDCPro />
    </Suspense>
  );
}