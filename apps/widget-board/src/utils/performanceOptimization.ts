/**
 * Performance Optimization Utilities
 * Implements lazy loading, code splitting, and asset optimization
 *
 * FIX #1: Page Load Time Optimization
 * Target: < 3 seconds initial load time
 */

/**
 * Dynamic chunk loading with preloading strategy
 * Reduces initial bundle size and enables progressive enhancement
 */
export const createChunkLoader = () => {
  const loadedChunks = new Map<string, any>();

  return {
    /**
     * Load a widget chunk only when needed
     */
    loadWidget: async (widgetName: string, importPath: string) => {
      if (loadedChunks.has(widgetName)) {
        return loadedChunks.get(widgetName);
      }

      try {
        // Dynamic import with error boundary
        const module = await import(/* @vite-ignore */ importPath);
        const component = module.default || module;
        loadedChunks.set(widgetName, component);
        return component;
      } catch (error) {
        console.error(`Failed to load widget: ${widgetName}`, error);
        throw new Error(`Widget "${widgetName}" failed to load`);
      }
    },

    /**
     * Preload common widgets on idle
     */
    preloadCommonWidgets: (widgetPaths: Record<string, string>) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          Object.entries(widgetPaths).forEach(([name, path]) => {
            this.loadWidget(name, path).catch(() => {
              // Silently fail preload attempts
            });
          });
        });
      }
    },

    /**
     * Clear unused chunks from memory
     */
    clearUnused: (activeWidgetIds: string[]) => {
      const activeSet = new Set(activeWidgetIds);
      for (const [key] of loadedChunks) {
        if (!activeSet.has(key)) {
          loadedChunks.delete(key);
        }
      }
    }
  };
};

/**
 * Asset optimization: defer non-critical images and scripts
 */
export const optimizeAssets = () => {
  // Defer image loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Remove render-blocking resources
  const deferScripts = () => {
    document.querySelectorAll('script[data-defer]').forEach(script => {
      const newScript = document.createElement('script');
      newScript.src = script.getAttribute('src') || '';
      newScript.async = true;
      document.body.appendChild(newScript);
      script.remove();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', deferScripts);
  } else {
    deferScripts();
  }
};

/**
 * Performance monitoring and metrics collection
 */
export const setupPerformanceMonitoring = (onMetrics?: (metrics: any) => void) => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.debug(`[Performance] ${entry.name}: ${entry.duration}ms`);
          if (onMetrics) {
            onMetrics({
              type: entry.entryType,
              name: entry.name,
              duration: entry.duration,
              timestamp: entry.startTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] });
    } catch (e) {
      console.warn('Performance monitoring not available');
    }
  }

  // Report Web Vitals
  if ('web-vital' in window || typeof window !== 'undefined') {
    // Fallback manual measurement
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.debug(`[Vitals] Page Load Time: ${pageLoadTime}ms`);

      if (onMetrics) {
        onMetrics({
          type: 'page-load',
          duration: pageLoadTime,
          timestamp: Date.now()
        });
      }
    });
  }
};

/**
 * Service Worker registration for caching strategy
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Implement cache-first strategy for static assets
      const sw = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered:', sw);
      return sw;
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }
};

export default {
  createChunkLoader,
  optimizeAssets,
  setupPerformanceMonitoring,
  registerServiceWorker
};
