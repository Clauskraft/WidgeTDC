import type { MSWidget, MSWidgetDetectionResult } from '../types';

export class MSWidgetDetector {
  private static readonly MS_WIDGETS_REGISTRY_PATH = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Widgets';

  static async detectInstalledWidgets(): Promise<MSWidgetDetectionResult[]> {
    console.log("Scanning system for Microsoft widgets (simplified)...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const detectionMethods = [
      this.scanRegistry(),
    ];
    
    const results = await Promise.all(detectionMethods);
    return results.filter(result => result.widgets.length > 0);
  }
  
  private static async scanRegistry(): Promise<MSWidgetDetectionResult> {
    const mockWidgets: MSWidget[] = [
      {
        id: 'ms-weather',
        displayName: 'Vejr',
        template: this.getWeatherTemplate(),
        capabilities: ['location', 'weather'],
        size: 'medium'
      },
      {
        id: 'ms-news', 
        displayName: 'Nyheder',
        template: this.getNewsTemplate(),
        capabilities: ['news'],
        size: 'large'
      }
    ];
    
    return {
      widgets: mockWidgets,
      source: 'registry',
      confidence: 0.8
    };
  }
  
  private static getWeatherTemplate() {
    return {
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          text: "Vejr",
          size: "Large",
          weight: "Bolder"
        }
      ]
    };
  }

  private static getNewsTemplate() {
     return {
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          text: "Seneste Nyheder",
          size: "Large",
          weight: "Bolder"
        }
      ]
    };
  }
}