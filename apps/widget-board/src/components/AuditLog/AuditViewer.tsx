import React, { useState, useCallback, useMemo } from 'react';
import './AuditViewer.css';

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  hashVerified?: boolean;
}

interface FilterOptions {
  startDate: number;
  endDate: number;
  eventTypes: string[];
  userId?: string;
}

export const AuditViewer: React.FC<{ events: AuditEvent[] }> = ({ events }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
    eventTypes: [],
    userId: undefined,
  });

  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const uniqueEventTypes = useMemo(
    () => [...new Set(events.map(e => e.eventType))],
    [events]
  );

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (event.timestamp < filters.startDate || event.timestamp > filters.endDate) {
        return false;
      }
      if (
        filters.eventTypes.length > 0 &&
        !filters.eventTypes.includes(event.eventType)
      ) {
        return false;
      }
      if (filters.userId && event.userId !== filters.userId) {
        return false;
      }
      return true;
    });
  }, [events, filters]);

  const handleExport = useCallback(() => {
    const timestamp = new Date().toISOString();
    const filename = `audit-trail-${timestamp}.${exportFormat}`;

    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(filteredEvents, null, 2);
      downloadFile(dataStr, filename, 'application/json');
    } else if (exportFormat === 'csv') {
      const csv = convertToCSV(filteredEvents);
      downloadFile(csv, filename, 'text/csv');
    } else if (exportFormat === 'pdf') {
      console.log('PDF export requires additional library');
    }
  }, [filteredEvents, exportFormat]);

  return (
    <div className="audit-viewer">
      <div className="audit-header">
        <h2>📋 Audit Log Viewer</h2>
        <div className="audit-stats">
          <span>{filteredEvents.length} events</span>
          <span>{events.filter(e => e.hashVerified).length} verified</span>
        </div>
      </div>

      <div className="audit-filters">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="datetime-local"
            value={new Date(filters.startDate).toISOString().slice(0, 16)}
            onChange={e =>
              setFilters({
                ...filters,
                startDate: new Date(e.target.value).getTime(),
              })
            }
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="datetime-local"
            value={new Date(filters.endDate).toISOString().slice(0, 16)}
            onChange={e =>
              setFilters({
                ...filters,
                endDate: new Date(e.target.value).getTime(),
              })
            }
          />
        </div>

        <div className="filter-group">
          <label>Event Types:</label>
          <select
            multiple
            value={filters.eventTypes}
            onChange={e =>
              setFilters({
                ...filters,
                eventTypes: Array.from(e.target.selectedOptions, o => o.value),
              })
            }
          >
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Export Format:</label>
          <select
            value={exportFormat}
            onChange={e =>
              setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')
            }
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={handleExport} className="btn-export">
            📥 Export
          </button>
        </div>
      </div>

      <div className="audit-events">
        {filteredEvents.map(event => (
          <div key={event.id} className="audit-event">
            <div className="event-header">
              <span className="event-type">{event.eventType}</span>
              <span className="event-user">User: {event.userId}</span>
              <span className="event-time">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              {event.hashVerified && <span className="hash-verified">✅ Verified</span>}
            </div>
            <div className="event-action">{event.action}</div>
            {Object.keys(event.details).length > 0 && (
              <div className="event-details">
                <pre>{JSON.stringify(event.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function convertToCSV(events: AuditEvent[]): string {
  const headers = ['ID', 'Timestamp', 'Event Type', 'User ID', 'Action', 'Hash Verified'];
  const rows = events.map(e => [
    e.id,
    new Date(e.timestamp).toISOString(),
    e.eventType,
    e.userId,
    e.action,
    e.hashVerified ? 'Yes' : 'No',
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  return csvContent;
}
