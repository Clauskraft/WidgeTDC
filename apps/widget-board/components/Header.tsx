import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import HelpModal from './HelpModal';
import { useMCP } from './MCPContext';
import { Button } from './ui/Button';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';

interface HeaderProps {
  onOpenWidgetManagement: () => void;
  onResetWidgets?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenWidgetManagement, onResetWidgets }) => {
  const { state, setTheme, toggleReduceMotion } = useGlobalState();
  const mcp = useMCP();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <header
        data-visible={isVisible}
        className={`fixed top-0 left-0 right-0 z-30 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          }`}>
        <div className="px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              ></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">WidgetBoard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => mcp.publish('TriggerUndo')} className="ms-icon-button ms-focusable" title="Fortryd (Ctrl+Z)">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
            </button>
            <button onClick={() => mcp.publish('TriggerRedo')} className="ms-icon-button ms-focusable" title="Annuller Fortryd (Ctrl+Y)">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600"></div>

            <button
              onClick={onOpenWidgetManagement}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-[var(--shadow-button)]"
              title="Administrer widgets"
            >
              <MicrosoftIcons.Settings />
              <span className="font-medium">Widgets</span>
            </button>

            {onResetWidgets && (
              <button
                onClick={onResetWidgets}
                className="flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:opacity-90 transition-all shadow-[var(--shadow-button)]"
                title="Nulstil widgets til standard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Reset</span>
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600"></div>
            <Button
              onClick={() => setIsHelpModalOpen(true)}
              variant="subtle"
              className="font-medium"
              title="Hjælp og Vejledning"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Hjælp
            </Button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600"></div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Dark Mode</span>
              <button
                onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                className={`ms-focusable relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${state.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${state.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600"></div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Reduce Motion</span>
              <button
                onClick={toggleReduceMotion}
                className={`ms-focusable relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${state.reduceMotion ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${state.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-16"></div>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default Header;
