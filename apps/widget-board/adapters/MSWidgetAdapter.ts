import React from 'react';
import { MSWidgetRenderer } from '../compatibility/MSWidgetRenderer';
import type { WidgetDefinition, MSWidget } from '../types';

// MS Widgets → OpenWidgets Adapter
export class MSWidgetAdapter {
  transformToWidgetDefinition(msWidget: MSWidget): WidgetDefinition {
    const newId = `Transformed-${msWidget.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    const TransformedWidgetComponent: React.FC<{ widgetId: string }> = ({ widgetId }) => {
      return React.createElement(MSWidgetRenderer, {
        widget: msWidget,
        widgetId: widgetId,
      });
    };
    TransformedWidgetComponent.displayName = `TransformedWidget(${msWidget.displayName})`;

    const definition: WidgetDefinition = {
      id: newId,
      name: `(MS) ${msWidget.displayName}`,
      component: TransformedWidgetComponent,
      defaultLayout: { w: 5, h: 6 },
      source: 'microsoft',
      msWidgetData: msWidget,
    };
    
    return definition;
  }
}