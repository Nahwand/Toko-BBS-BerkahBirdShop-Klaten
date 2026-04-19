import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7f2] p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-extrabold text-bbs-green-dark mb-2">Terjadi Kesalahan</div>
          <div className="text-sm text-gray-500 mb-6 max-w-md">{this.state.error?.message || 'Komponen mengalami error yang tidak terduga.'}</div>
          <button
            className="px-6 py-2.5 bg-bbs-green text-white rounded-xl font-bold text-sm border-none cursor-pointer"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          >
            🔄 Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
