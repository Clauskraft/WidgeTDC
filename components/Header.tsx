import React, { useState } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import HelpModal from './HelpModal';

const Header: React.FC = () => {
  const { state, setTheme } = useGlobalState();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <>
      <header className="flex-shrink-0 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">WidgetBoard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Hjælp og Vejledning"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hjælp
            </button>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600"></div>
            
            <div className="flex items-center space-x-2">
               <span className="text-sm font-medium">Dark Mode</span>
              <button
                onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  state.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  state.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default Header;