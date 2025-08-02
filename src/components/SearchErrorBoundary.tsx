import { Component, ErrorInfo, ReactNode } from 'react';
import { SimpleSearch } from './SimpleSearch';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SearchErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('Search ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Search ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Fallback to SimpleSearch when there's an error
      return <SimpleSearch />;
    }

    return this.props.children;
  }
}

export default SearchErrorBoundary; 