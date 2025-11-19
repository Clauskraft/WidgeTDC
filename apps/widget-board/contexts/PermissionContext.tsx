import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkWidgetAccess, getWidgetPermissions } from '../utils/permissionsApi';

interface PermissionContextType {
  hasAccess: (resourceType: string, requiredLevel: 'read' | 'write') => Promise<boolean>;
  permissions: any[];
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode; widgetId: string }> = ({ children, widgetId }) => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      const perms = await getWidgetPermissions(widgetId);
      setPermissions(perms);
      setLoading(false);
    };
    loadPermissions();
  }, [widgetId]);

  const hasAccess = async (resourceType: string, requiredLevel: 'read' | 'write'): Promise<boolean> => {
    return await checkWidgetAccess(widgetId, resourceType, requiredLevel);
  };

  return (
    <PermissionContext.Provider value={{ hasAccess, permissions, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};
