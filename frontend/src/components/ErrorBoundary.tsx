import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Explicitly bind state to the local instance context to prevent inheritance lookup failure
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Platform Uncaught Exception Boundary:', error, errorInfo);
  }

  render() {
    // ✅ FORCE BIND INSTANCE FIELDS VIA TYPE CASTING
    const instanceState = (this as any).state as State;
    const instanceProps = (this as any).props as Props;

    if (instanceState.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 border border-slate-900">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">System Core Halted</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected interface disruption occurred. Live system diagnostics are intact, but this view had to safely detach.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Hot Reload System
            </button>
          </div>
        </div>
      );
    }
    return instanceProps.children;
  }
}
