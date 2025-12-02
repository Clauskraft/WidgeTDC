import React, { lazy } from 'react';
import { ModuleGrid, ModuleCard } from './ModuleGrid';

const CybersecurityOverwatchWidget = lazy(() => import('../../../widgets/CybersecurityOverwatchWidget'));
const NetworkSpyWidget = lazy(() => import('../../../widgets/NetworkSpyWidget'));
const DarkWebMonitorWidget = lazy(() => import('../../../widgets/DarkWebMonitorWidget'));
const LocalScanWidget = lazy(() => import('../../../widgets/LocalScanWidget'));
const SystemMonitorWidget = lazy(() => import('../../../widgets/SystemMonitorWidget'));

export default function CyberCommandView() {
  return (
    <ModuleGrid>
      <ModuleCard title="Overwatch Global Status" colSpan={2} rowSpan={2}>
        <CybersecurityOverwatchWidget widgetId="overwatch-status" />
      </ModuleCard>
      <ModuleCard title="Network Traffic Spy">
        <NetworkSpyWidget widgetId="network-spy" />
      </ModuleCard>
      <ModuleCard title="Dark Web Threats">
        <DarkWebMonitorWidget widgetId="darkweb-monitor" />
      </ModuleCard>
      <ModuleCard title="Local System Scan">
        <LocalScanWidget widgetId="local-scan" />
      </ModuleCard>
      <ModuleCard title="Hardware Monitor">
        <SystemMonitorWidget widgetId="sys-monitor" />
      </ModuleCard>
    </ModuleGrid>
  );
}
