import { WidgetMetadata, WidgetVersion, RegistryFilter } from './types';

export class WidgetRegistry {
  private widgets: Map<string, WidgetMetadata> = new Map();
  private versions: Map<string, WidgetVersion[]> = new Map();

  register(widget: WidgetMetadata): void {
    this.widgets.set(widget.id, widget);
    const versions = this.versions.get(widget.id) || [];
    versions.push({
      version: widget.version,
      releaseDate: new Date(),
      changelog: 'Initial version',
      deprecated: false
    });
    this.versions.set(widget.id, versions);
  }

  getWidget(id: string): WidgetMetadata | undefined {
    return this.widgets.get(id);
  }

  getAllWidgets(): WidgetMetadata[] {
    return Array.from(this.widgets.values());
  }

  filterWidgets(filter: RegistryFilter): WidgetMetadata[] {
    let results = this.getAllWidgets();
    if (filter.capabilities && filter.capabilities.length > 0) {
      results = results.filter(widget =>
        filter.capabilities!.every(cap => widget.capabilities.includes(cap))
      );
    }
    if (filter.version) {
      results = results.filter(widget => widget.version === filter.version);
    }
    if (filter.author) {
      results = results.filter(widget => widget.author === filter.author);
    }
    return results;
  }

  getVersionHistory(widgetId: string): WidgetVersion[] {
    return this.versions.get(widgetId) || [];
  }

  deprecateVersion(widgetId: string, version: string): void {
    const versions = this.versions.get(widgetId);
    if (versions) {
      const versionEntry = versions.find(v => v.version === version);
      if (versionEntry) {
        versionEntry.deprecated = true;
      }
    }
  }

  searchByCapability(capability: string): WidgetMetadata[] {
    return this.getAllWidgets().filter(widget =>
      widget.capabilities.includes(capability)
    );
  }
}

export const registry = new WidgetRegistry();
