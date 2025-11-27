import { useEffect, useRef } from 'react';
import { useMCP } from './useMCP';

/**
 * useWidgetSync - Synkroniserer widget state til systemets hukommelse
 * Gør det muligt for AI'en (Hjernen) at "se" hvad widgetten viser.
 * 
 * @param widgetId Unik ID for widgetten
 * @param state Data objekt der skal synkroniseres (f.eks. { emails: [...], unreadCount: 5 })
 * @param debounceMs Ventetid før synkronisering (default 2000ms)
 */
export const useWidgetSync = (widgetId: string, state: any, debounceMs = 2000) => {
    const { send } = useMCP();
    const lastSyncedRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const stateString = JSON.stringify(state);
        
        // Undgå at synkronisere hvis data ikke har ændret sig
        if (stateString === lastSyncedRef.current) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            console.log(`🧠 Synkroniserer widget memory: ${widgetId}`);
            
            send('agent-orchestrator', 'widgets.update_state', {
                widgetId,
                state: {
                    ...state,
                    _syncedAt: new Date().toISOString()
                }
            }).catch(err => {
                console.warn(`⚠️ Fejl ved widget sync (${widgetId}):`, err);
            });

            lastSyncedRef.current = stateString;
        }, debounceMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [widgetId, state, debounceMs, send]);
};

