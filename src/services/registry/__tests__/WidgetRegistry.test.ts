import { WidgetRegistry } from '../WidgetRegistry';
import { WidgetMetadata } from '../types';

describe('WidgetRegistry', () => {
  let registry: WidgetRegistry;

  beforeEach(() => {
    registry = new WidgetRegistry();
  });

  test('should register widget', () => {
    const mockWidget: WidgetMetadata = {
      id: 'test-1',
      name: 'Test Widget',
      version: '1.0.0',
      description: 'Test',
      author: 'TestAuthor',
      capabilities: ['ui', 'data'],
      dependencies: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    registry.register(mockWidget);
    expect(registry.getWidget('test-1')).toEqual(mockWidget);
  });

  test('should filter by capabilities', () => {
    const mockWidget: WidgetMetadata = {
      id: 'test-1',
      name: 'Test Widget',
      version: '1.0.0',
      description: 'Test',
      author: 'TestAuthor',
      capabilities: ['ui'],
      dependencies: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    registry.register(mockWidget);
    const filtered = registry.filterWidgets({ capabilities: ['ui'] });
    expect(filtered.length).toBe(1);
  });
});
