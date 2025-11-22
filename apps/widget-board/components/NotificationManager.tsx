import React, { useState, useEffect } from 'react';
import { useMcpEvent } from './useMcpEvent';
import type { NotificationPayload } from './MCPTypes';
import { useMCP } from './MCPContext';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const Toast: React.FC<{ notification: NotificationPayload; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    const mcp = useMCP();
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timer);
    }, [notification, onDismiss]);

    const handleUndo = () => {
        if (notification.undoAction) {
            // @ts-ignore - We trust the payload structure from the publisher
            mcp.publish(notification.undoAction.eventName, notification.undoAction.payload);
            onDismiss(notification.id); // Luk notifikationen, når der er klikket fortryd
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 w-full max-w-sm flex items-start gap-3 animate-slide-in-from-right">
            <div className="flex-shrink-0 mt-0.5">
                {icons[notification.type]}
            </div>
            <div className="flex-1">
                {notification.title && <h4 className="font-semibold text-card-foreground">{notification.title}</h4>}
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                {notification.undoAction && (
                    <button onClick={handleUndo} className="text-sm font-semibold text-primary mt-2 hover:underline">
                        Fortryd
                    </button>
                )}
            </div>
            <button onClick={() => onDismiss(notification.id)} className="p-1 rounded-full hover:bg-accent -mt-1 -mr-1">
                <X className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    );
};


export const NotificationManager: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

    useMcpEvent('ShowNotification', (payload) => {
        // Sørg for at hver notifikation har et unikt ID
        const newNotification = { ...payload, id: payload.id || `toast-${Date.now()}` };
        setNotifications(prev => [newNotification, ...prev]);
    });

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {notifications.map(notification => (
                <Toast key={notification.id} notification={notification} onDismiss={dismissNotification} />
            ))}
        </div>
    );
};