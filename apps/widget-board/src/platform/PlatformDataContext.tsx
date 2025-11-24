/**
 * Platform Data Context
 * 
 * Provides UnifiedDataService to all widgets via React Context
 */

import React, { createContext, useContext, PropsWithChildren } from 'react';
import { UnifiedDataService, getDataService } from './src/services/UnifiedDataService';

const DataContext = createContext<UnifiedDataService | null>(null);

export const DataProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const dataService = getDataService();
    return <DataContext.Provider value={dataService}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};
