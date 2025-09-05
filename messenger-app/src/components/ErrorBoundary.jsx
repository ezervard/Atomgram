import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ошибка в компоненте:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          <h2>Произошла ошибка</h2>
          <p>{this.state.error?.message || 'Неизвестная ошибка'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;