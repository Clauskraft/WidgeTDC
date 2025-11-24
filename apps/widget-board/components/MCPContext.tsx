import React, { createContext, useContext } from 'react';
import { MCPEventBus } from './MCPEventBus';

// Create a single, global instance of the event bus.
const mcpEventBus = new MCPEventBus();

const MCPContext = createContext<MCPEventBus>(mcpEventBus);

export const MCPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <MCPContext.Provider value={mcpEventBus}>
            {children}
        </MCPContext.Provider>
    );
};

export const useMCP = (): MCPEventBus => {
    return useContext(MCPContext);
};