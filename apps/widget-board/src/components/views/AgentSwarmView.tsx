import React, { lazy, ComponentType } from 'react';
import { ModuleGrid, ModuleCard } from './ModuleGrid';

// Widget prop type
interface WidgetProps { widgetId: string; }

const AgentStatusDashboardWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/AgentStatusDashboardWidget'));
const EvolutionAgentWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/EvolutionAgentWidget'));
const PersonaCoordinatorWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/PersonaCoordinatorWidget'));
const AgentBuilderWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/AgentBuilderWidget'));
const HansPedderMonitorWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/HansPedderMonitor'));
const IntelligenceEvolutionWidget = lazy<ComponentType<WidgetProps>>(() => import('../../../widgets/IntelligenceEvolutionWidget'));

export default function AgentSwarmView() {
  return (
    <ModuleGrid>
      <ModuleCard title="Swarm Status Overview" colSpan={2} rowSpan={1}>
        <AgentStatusDashboardWidget widgetId="swarm-status" />
      </ModuleCard>
      <ModuleCard title="HansPedder Special Ops">
        <HansPedderMonitorWidget widgetId="hanspedder-ops" />
      </ModuleCard>
      <ModuleCard title="Self-Evolution Engine">
        <EvolutionAgentWidget widgetId="evolution-engine" />
      </ModuleCard>
      <ModuleCard title="Persona Matrix">
        <PersonaCoordinatorWidget widgetId="persona-matrix" />
      </ModuleCard>
      <ModuleCard title="Agent Fabrication">
        <AgentBuilderWidget widgetId="agent-builder" />
      </ModuleCard>
      <ModuleCard title="System IQ Tracking">
        <IntelligenceEvolutionWidget widgetId="iq-tracking" />
      </ModuleCard>
    </ModuleGrid>
  );
}
