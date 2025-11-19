import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { GlobalState, Theme } from '../types';

interface GlobalStateContextType {
  state: GlobalState;
  setTheme: (theme: Theme) => void;
  toggleReduceMotion: () => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalState>({
    theme: 'dark',
    reduceMotion: false,
    user: { name: 'Bruger' },
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const setTheme = (theme: Theme) => {
    setState(prev => ({ ...prev, theme }));
  };

  const toggleReduceMotion = () => {
    setState(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  };

  return (
    <GlobalStateContext.Provider value={{ state, setTheme, toggleReduceMotion }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
