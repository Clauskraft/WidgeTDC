import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const { children } = this.props;

    if (!hasError) {
      return children;
    }

    return (
      <div className="min-h-screen bg-slate-900 text-red-500 p-8 font-mono">
        <h1 className="text-3xl font-bold mb-4">⚠️ SYSTEM CRASH DETECTED</h1>
        <div className="bg-slate-800 p-6 rounded border border-red-500/30">
          <h2 className="text-xl mb-2 text-white">Error Trace:</h2>
          <pre className="whitespace-pre-wrap bg-black/50 p-4 rounded overflow-auto max-h-[60vh] text-sm">
            {error?.toString()}
            {errorInfo?.componentStack && (
              <>
                <br />
                {errorInfo.componentStack}
              </>
            )}
          </pre>
        </div>
        <button 
          onClick={this.handleReload}
          className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-bold"
        >
          REBOOT SYSTEM
        </button>
      </div>
    );
  }
}