import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
            <div className="text-center text-gray-600 max-w-md mx-auto px-6">
              <div className="mb-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">
                Erro no Componente
              </h3>
              <p className="text-gray-500 mb-4">
                Ocorreu um erro inesperado. A aplicação continuará funcionando.
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Detalhes técnicos:</p>
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                    {this.state.error?.message || 'Erro desconhecido'}
                  </p>
                </div>
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}