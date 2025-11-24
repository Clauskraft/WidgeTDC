/**
 * Platform Provider Component
 * 
 * React provider that instantiates and provides platform services
 * to the component tree via Context API.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { PlatformServices, PlatformBootstrapOptions } from './PlatformContext';
import { bootstrapPlatform } from './PlatformContext';

/**
 * Platform context
 */
const PlatformContext = createContext<PlatformServices | undefined>(undefined);

/**
 * Platform provider props
 */
export interface PlatformProviderProps {
  /** Child components */
  children: ReactNode;
  
  /** Bootstrap options */
  options?: PlatformBootstrapOptions;
}

/**
 * Platform Provider Component
 * 
 * Wraps the application with platform services context.
 * 
 * @example
 * ```tsx
 * import { PlatformProvider } from '@/src/platform/core/PlatformProvider';
 * 
 * function App() {
 *   return (
 *     <PlatformProvider>
 *       <YourApp />
 *     </PlatformProvider>
 *   );
 * }
 * ```
 */
export function PlatformProvider({ children, options }: PlatformProviderProps) {
  const [services, setServices] = useState<PlatformServices | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function initializePlatform() {
      try {
        const platformServices = await bootstrapPlatform(options);
        
        if (mounted) {
          setServices(platformServices);
          
          // Log platform initialization to audit log
          if (platformServices.auditLog) {
            await platformServices.auditLog.append({
              timestamp: new Date(),
              domain: 'system',
              sensitivity: 'internal',
              actor: {
                type: 'system',
                id: 'platform',
                name: 'Platform Bootstrap',
              },
              payload: {
                action: 'platform.initialized',
                outcome: 'success',
                metadata: {
                  auditEnabled: options?.enableAudit !== false,
                  vectorStoreEnabled: options?.enableVectorStore !== false,
                },
              },
              retention: {
                retentionDays: 365,
                archiveBeforeDelete: true,
                legalHold: false,
              },
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          // Log error to audit log if available
          if (typeof options?.auditLog?.append === 'function') {
            options.auditLog.append({
              timestamp: new Date(),
              domain: 'system',
              sensitivity: 'internal',
              actor: {
                type: 'system',
                id: 'platform',
                name: 'Platform Bootstrap',
              },
              payload: {
                action: 'platform.initialized',
                outcome: 'error',
                metadata: {
                  error: (err instanceof Error) ? err.message : String(err),
                },
              },
              retention: {
                retentionDays: 365,
                archiveBeforeDelete: true,
                legalHold: false,
              },
            });
          }
        }
    }

    initializePlatform();

    return () => {
      mounted = false;
    };
  }, [options]);

  // Log error details for developers
  useEffect(() => {
    if (error) {
      // In production, replace with secure logging service
      // eslint-disable-next-line no-console
      console.error('Platform initialization error:', error);
    }
  }, [error]);

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Platform Initialization Error</h2>
        <p>
          An unexpected error occurred during platform initialization. Please contact support or try again later.
        </p>
      </div>
    );
  }

  // Show loading state
  if (!services) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Initializing platform services...</p>
      </div>
    );
  }

  return (
    <PlatformContext.Provider value={services}>
      {children}
    </PlatformContext.Provider>
  );
}

/**
 * Hook to access platform services
 * 
 * @returns Platform services
 * @throws Error if used outside PlatformProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { auditLog, widgetRegistry } = usePlatform();
 *   
 *   const handleAction = async () => {
 *     await auditLog.append({
 *       // ... audit event
 *     });
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePlatform(): PlatformServices {
  const context = useContext(PlatformContext);
  
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  
  return context;
}

/**
 * Hook to access a specific platform service
 * 
 * @param serviceName Name of the service to access
 * @returns The requested service
 * @throws Error if used outside PlatformProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const auditLog = usePlatformService('auditLog');
 *   const vectorStore = usePlatformService('vectorStore');
 *   
 *   // Use services...
 * }
 * ```
 */
export function usePlatformService<K extends keyof PlatformServices>(
  serviceName: K
): PlatformServices[K] {
  const services = usePlatform();
  return services[serviceName];
}
