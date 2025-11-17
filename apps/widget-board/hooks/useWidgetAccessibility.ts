import { useEffect } from 'react';

export const useWidgetAccessibility = (widgetId: string, title: string) => {
  useEffect(() => {
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Widget '${title}' er tilføjet.`;
    }

    return () => {
      const liveRegion = document.getElementById('a11y-live-region');
      if (liveRegion) {
        liveRegion.textContent = `Widget '${title}' er fjernet.`;
      }
    };
  }, [widgetId, title]);
};
