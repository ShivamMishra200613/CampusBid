import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-primary-container text-on-surface">
          <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-lg">
            <span className="material-symbols-outlined text-[52px] text-error mb-4">
              error_outline
            </span>
            <h1 className="font-headline-md text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="font-body-md text-sm text-secondary mb-6">
              An unexpected client error occurred. Please refresh the page or return to the
              marketplace.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Reload Page
              </button>
              <a href="/" className="btn-secondary">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
