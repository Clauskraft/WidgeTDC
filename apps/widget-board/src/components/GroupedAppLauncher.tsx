import React, { useMemo, useState } from 'react';
import { WIDGET_GROUPS, WidgetGroup, getGroupForWidget } from '../utils/widgetGrouping';
import { widgetMetadata, staticWidgetRegistry } from '../staticWidgetRegistry';
import { MatrixWidgetWrapper } from './MatrixWidgetWrapper';
import { Search, Grid, List, ArrowRight, Star, Sparkles } from 'lucide-react';

interface AppLauncherProps {
  onLaunch: (widgetId: string) => void;
}

export const AppLauncher: React.FC<AppLauncherProps & { selectedGroup?: string }> = ({ onLaunch, selectedGroup }) => {
  const [internalActiveGroup, setInternalActiveGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use prop if provided (controlled), otherwise internal state
  const activeGroup = selectedGroup || internalActiveGroup;

  const filteredWidgets = useMemo(() => {
    let widgets = Object.keys(staticWidgetRegistry);

    // Filter by group
    if (activeGroup !== 'all') {
      const group = WIDGET_GROUPS.find(g => g.id === activeGroup);
      if (group) {
        widgets = widgets.filter(id => group.widgets.includes(id));
      }
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      widgets = widgets.filter(id => {
        const meta = widgetMetadata[id];
        return (
          id.toLowerCase().includes(q) ||
          meta?.name.toLowerCase().includes(q) ||
          meta?.description.toLowerCase().includes(q)
        );
      });
    }

    return widgets;
  }, [activeGroup, searchQuery]);

  const renderWidgetCard = (widgetId: string) => {
    const meta = widgetMetadata[widgetId] || { name: widgetId, description: 'No description', category: 'General' };
    const group = getGroupForWidget(widgetId);
    const Icon = group?.icon || Grid; // Fallback icon

    return (
      <button
        key={widgetId}
        onClick={() => onLaunch(widgetId)}
        className="group relative flex flex-col items-start p-4 rounded-xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left w-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex justify-between w-full mb-3 relative z-10">
          <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform duration-300 ${group?.color || 'text-gray-400'}`}>
            <Icon size={20} />
          </div>
          {/* Star/Fav button placeholder */}
        </div>

        <h3 className="text-sm font-medium text-white mb-1 relative z-10 truncate w-full pr-4">
          {meta.name}
        </h3>
        <p className="text-[10px] text-gray-400 line-clamp-2 relative z-10 min-h-[2.5em]">
          {meta.description}
        </p>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
          <ArrowRight size={16} className="text-[#00B5CB]" />
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Hero / Search Header */}
      <div className="mb-8 relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-[#00B5CB]/10 via-transparent to-transparent rounded-3xl blur-xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-white flex items-center gap-2">
              <Sparkles className="text-[#00B5CB] w-6 h-6" />
              {activeGroup !== 'all' ? WIDGET_GROUPS.find(g => g.id === activeGroup)?.title : 'App Directory'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {activeGroup !== 'all' 
                ? WIDGET_GROUPS.find(g => g.id === activeGroup)?.description 
                : 'Launch neural modules and executive tools'}
            </p>
          </div>
          
          <div className="w-full md:w-auto min-w-[300px]">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#00B5CB] transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50 focus:ring-1 focus:ring-[#00B5CB]/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Pills - Only show if NOT controlled by prop */}
        {!selectedGroup && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
            <button
              onClick={() => setInternalActiveGroup('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeGroup === 'all'
                  ? 'bg-[#00B5CB] text-[#051e3c] border-[#00B5CB]'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Apps
            </button>
            {WIDGET_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => setInternalActiveGroup(group.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
                  activeGroup === group.id
                    ? 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {/* Using dynamic component for icon if possible, else just label */}
                {group.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* App Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activeGroup === 'all' && !searchQuery ? (
          // Grouped View (Default)
          <div className="space-y-8">
            {WIDGET_GROUPS.map(group => {
              const groupWidgets = group.widgets.filter(id => staticWidgetRegistry[id]);
              if (groupWidgets.length === 0) return null;
              
              const GroupIcon = group.icon;

              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider px-1">
                    <GroupIcon size={16} className={group.color.replace('text-', 'text-')} />
                    {group.title}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupWidgets.map(id => renderWidgetCard(id))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Filtered/Flattened View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredWidgets.map(id => renderWidgetCard(id))}
            {filteredWidgets.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                No apps found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
