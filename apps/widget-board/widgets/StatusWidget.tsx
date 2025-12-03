import React from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const StatusWidget: React.FC<{ widgetId: string }> = () => {
  const { availableWidgets } = useWidgetRegistry();
  const { state } = useGlobalState();

  return (
    <MatrixWidgetWrapper title="System Status">
      <div className="space-y-4">
        {/* Header Banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
           <div className="relative">
             <div className="w-2 h-2 rounded-full bg-green-400" />
             <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
           </div>
           <div>
             <h4 className="text-sm font-medium text-green-300 leading-none">All Systems Operational</h4>
             <p className="text-[10px] text-green-400/70 mt-1">Core services running smoothly</p>
           </div>
        </div>
        
        {/* Status Grid */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-1">
          <StatusItem 
            label="Environment" 
            value="Production" 
            status="success" 
          />
          <StatusItem 
            label="Version" 
            value="2.0.0 (Matrix)" 
            status="info" 
          />
          <StatusItem 
            label="Active Theme" 
            value={state.theme === 'dark' ? 'Dark Nebula' : 'Light'} 
            status="info" 
          />
          <StatusItem 
            label="Loaded Widgets" 
            value={availableWidgets.length} 
            status={availableWidgets.length > 0 ? 'success' : 'warning'} 
          />
          <StatusItem 
            label="Motion Effects" 
            value={state.reduceMotion ? 'Reduced' : 'Full'} 
            status="info" 
          />
        </div>

        <div className="text-[9px] text-gray-600 text-center font-mono">
          LAST SYNC: {new Date().toLocaleTimeString('da-DK')}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

const StatusItem: React.FC<{ label: string; value: string | number; status?: 'success' | 'warning' | 'info' }> = ({ 
  label, 
  value, 
  status = 'info' 
}) => {
  const statusColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    info: 'text-[#00B5CB]'
  };
  
  const StatusIcon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info
  }[status];

  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 rounded transition-colors">
      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
      <div className="flex items-center gap-2">
         <span className={`text-xs font-mono font-medium ${statusColors[status]}`}>{value}</span>
         <StatusIcon size={12} className={`${statusColors[status]} opacity-70`} />
      </div>
    </div>
  );
};

export default StatusWidget;
