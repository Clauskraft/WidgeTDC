import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    widgetName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in widget ${this.props.widgetName || 'Unknown'}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-500/10 p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                    <h3 className="text-sm font-medium text-red-200 mb-1">
                        {this.props.widgetName || 'Widget'} Crashed
                    </h3>
                    <p className="text-xs text-red-300/70 mb-3 max-w-[200px] truncate">
                        {this.state.error?.message || 'Unknown error occurred'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded-md transition-colors"
                    >
                        <RefreshCw size={12} />
                        Retry Widget
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
