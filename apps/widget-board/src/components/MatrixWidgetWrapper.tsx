import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

// --- ERROR BOUNDARY ---
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; title: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="text-red-400 mb-2" size={24} />
          <h3 className="text-red-300 font-medium text-sm mb-1">Widget Fejl: {this.props.title}</h3>
          <p className="text-red-400/70 text-xs text-center max-w-[200px] truncate">
            {this.state.error?.message || 'Ukendt fejl'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MATRIX WRAPPER ---
interface MatrixWidgetWrapperProps {
  children: React.ReactNode;
  title: string;
  isLoading?: boolean;
  controls?: React.ReactNode;
  className?: string;
}

export const MatrixWidgetWrapper: React.FC<MatrixWidgetWrapperProps> = ({
  children,
  title,
  isLoading = false,
  controls,
  className = ''
}) => {
  // Fallback theme values if hook not available yet
  const theme = {
    primary: '#051e3c',
    accent: '#00B5CB',
    glassBg: 'bg-[#0B3E6F]/30',
    glassBorder: 'border-white/10'
  };

  return (
    <WidgetErrorBoundary title={title}>
      <div 
        className={`
          flex flex-col h-full w-full 
          ${theme.glassBg} backdrop-blur-md 
          border ${theme.glassBorder} 
          rounded-2xl overflow-hidden shadow-xl
          transition-all duration-300 hover:border-[#00B5CB]/30
          ${className}
        `}
      >
        {/* Header */}
        <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-black/10 shrink-0">
          <h3 className="text-xs font-semibold text-gray-200 tracking-wide uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00B5CB] shadow-[0_0_5px_#00B5CB]"></span>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {controls}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto relative scrollbar-hide p-4">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2 className="text-[#00B5CB] animate-spin" size={24} />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </WidgetErrorBoundary>
  );
};
