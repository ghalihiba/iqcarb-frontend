import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props   { children: ReactNode; }
interface State   { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-lg">
            <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-gray-500 text-sm mb-2">
              {this.state.error?.message ?? 'Erreur inconnue'}
            </p>
            <p className="text-gray-400 text-xs mb-6">
              L'application a rencontré un problème inattendu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 mx-auto bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}