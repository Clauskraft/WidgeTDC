import React, { lazy, ComponentType } from 'react';
import { ModuleGrid, ModuleCard } from './ModuleGrid';

// Widget prop type
interface WidgetProps { widgetId: string; }

const StrategicCockpitWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/StrategicCockpit'));
const MindMapBuilderWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/MindMapBuilder'));
const ExecutiveRiskCanvasWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/ExecutiveRiskCanvas'));
const KanbanWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/KanbanWidget'));
const LocalWikiWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/LocalWikiWidget'));
const CmaDecisionWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/CmaDecisionWidget'));

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
