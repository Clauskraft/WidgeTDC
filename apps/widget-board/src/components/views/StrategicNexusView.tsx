import React, { lazy } from 'react';
import { ModuleGrid, ModuleCard } from './ModuleGrid';

const StrategicCockpitWidget = lazy(() => import('../../../widgets/StrategicCockpit'));
const MindMapBuilderWidget = lazy(() => import('../../../widgets/MindMapBuilder'));
const ExecutiveRiskCanvasWidget = lazy(() => import('../../../widgets/ExecutiveRiskCanvas'));
const KanbanWidget = lazy(() => import('../../../widgets/KanbanWidget'));
const LocalWikiWidget = lazy(() => import('../../../widgets/LocalWikiWidget'));
const CmaDecisionWidget = lazy(() => import('../../../widgets/CmaDecisionWidget'));

export default function StrategicNexusView() {
  return (
    <ModuleGrid>
      <ModuleCard title="Strategic Cockpit" colSpan={2} rowSpan={2}>
        <StrategicCockpitWidget widgetId="strategic-cockpit" />
      </ModuleCard>
      <ModuleCard title="Risk Control Surface">
        <ExecutiveRiskCanvasWidget widgetId="risk-canvas" />
      </ModuleCard>
      <ModuleCard title="Mind Map Architect" colSpan={2}>
        <MindMapBuilderWidget widgetId="mindmap-builder" />
      </ModuleCard>
      <ModuleCard title="Mission Kanban">
        <KanbanWidget widgetId="mission-kanban" />
      </ModuleCard>
      <ModuleCard title="Local Knowledge Base">
        <LocalWikiWidget widgetId="local-wiki" />
      </ModuleCard>
      <ModuleCard title="Decision Analysis">
        <CmaDecisionWidget widgetId="cma-decision" />
      </ModuleCard>
    </ModuleGrid>
  );
}
