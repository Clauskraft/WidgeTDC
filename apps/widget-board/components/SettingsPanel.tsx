import React, { useState } from 'react';
import { Button } from './ui/Button';
import { setPlatformDefault, setWidgetPermission } from '../utils/permissionsApi';

interface SettingsPanelProps {
  widgetId?: string; // If provided, show widget‑specific settings
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ widgetId, onClose }) => {
  const [resourceType, setResourceType] = useState('file_system');
  const [accessLevel, setAccessLevel] = useState('read');
  const [loading, setLoading] = useState(false);

  const isPlatform = !widgetId;
  const resourceTypes = ['file_system', 'local_storage', 'drives', 'clipboard', 'camera'];
  const accessLevels = ['none', 'read', 'write'];

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isPlatform) {
        await setPlatformDefault(resourceType, accessLevel as any);
      } else if (widgetId) {
        await setWidgetPermission(widgetId, resourceType, accessLevel as any, true);
      }
      alert('Permissions updated successfully');
      onClose();
    } catch (error) {
      alert('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          {isPlatform ? 'Platform Permissions' : `Widget Permissions: ${widgetId}`}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resource Type</label>
            <select
              title="Resource type"
              value={resourceType}
              onChange={e => setResourceType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              title="Access level"
              value={accessLevel}
              onChange={e => setAccessLevel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {accessLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          {widgetId && (
            <div>
              <label className="flex items-center">
                <input type="checkbox" checked={true} className="mr-2" readOnly />
                Override platform default
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={onClose} variant="default">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};
