export class CapabilityFilter {
  private index: Map<string, Set<string>> = new Map();

  addCapability(widgetId: string, capability: string): void {
    if (!this.index.has(capability)) {
      this.index.set(capability, new Set());
    }
    this.index.get(capability)?.add(widgetId);
  }

  filterByCapabilities(capabilities: string[]): Set<string> {
    const results = new Set<string>();

    for (const capability of capabilities) {
      const widgets = this.index.get(capability) || new Set();
      if (results.size === 0) {
        widgets.forEach(w => results.add(w));
      } else {
        const intersection = new Set(
          [...results].filter(w => widgets.has(w))
        );
        return intersection;
      }
    }

    return results;
  }
}
