import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

if (typeof window !== 'undefined' && typeof (window as any).require === 'undefined') {
  (window as any).require = (moduleName: string) => {
    console.warn(`[Web Polyfill] require('${moduleName}') called in browser ESM context.`);
    return {};
  };
}

import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Velotrack Runtime Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#07080D',
          color: '#FFFFFF',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#0E1326',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(230,0,80,0.3)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#E60050', marginBottom: '12px' }}>
              VELOTRACK PLATFORM
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px', lineHeight: '1.5' }}>
              Ocorreu um problema ao carregar a interface. Por favor, tente recarregar.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: '#060814',
                color: '#EF4444',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#E60050',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

