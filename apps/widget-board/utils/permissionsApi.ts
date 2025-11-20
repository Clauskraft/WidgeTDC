import { request } from './request';

export interface Permission {
  widgetId: string;
  resourceType: string;
  accessLevel: 'none' | 'read' | 'write';
  override: boolean;
}

export async function getWidgetPermissions(widgetId: string): Promise<Permission[]> {
  const response = await request<Permission[]>(`/api/security/permissions/${widgetId}`);
  return response;
}

export async function checkWidgetAccess(widgetId: string, resourceType: string, requiredLevel: 'read' | 'write'): Promise<boolean> {
  const response = await request<{ hasAccess: boolean }>('post', '/api/security/check-access', {
    body: JSON.stringify({ widgetId, resourceType, requiredLevel })
  });
  return response.hasAccess;
}

export async function setWidgetPermission(widgetId: string, resourceType: string, accessLevel: 'none' | 'read' | 'write', override: boolean = true): Promise<void> {
  await request('put', `/api/security/permissions/${widgetId}`, {
    body: JSON.stringify({ resourceType, accessLevel, override })
  });
}

export async function setPlatformDefault(resourceType: string, accessLevel: 'none' | 'read' | 'write'): Promise<void> {
  await request('post', '/api/security/platform-defaults', {
    body: JSON.stringify({ resourceType, accessLevel })
  });
}
