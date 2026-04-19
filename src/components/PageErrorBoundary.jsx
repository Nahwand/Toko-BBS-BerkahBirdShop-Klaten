import { Component } from 'react';

/**
 * Error boundary per halaman — lebih ringan dari root ErrorBoundary.
 * Kalau satu halaman crash, hanya halaman itu yang menampilkan error,
 * sidebar dan navigasi tetap berfungsi normal.
 */
export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[PageErrorBoundary] ${this.props.pageName || 'Page'} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="text-5xl mb-4">💥</div>
          <div className="text-base font-extrabold text-red-600 mb-2">
            Halaman {this.props.pageName || 'ini'} mengalami error
          </div>
          <div className="text-[13px] text-gray-400 mb-5 max-w-sm">
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga.'}
          </div>
          <button
            className="px-5 py-2.5 bg-bbs-green text-white rounded-xl font-bold text-sm border-none cursor-pointer"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
