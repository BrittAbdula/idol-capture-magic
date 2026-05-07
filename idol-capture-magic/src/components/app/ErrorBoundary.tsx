import React from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Route render failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white px-4 py-24 text-center text-gray-950">
          <h1 className="text-4xl font-semibold">Something went wrong</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            The page could not render. Return home and try the flow again.
          </p>
          <Link to="/" className="idol-button-square mt-8 inline-flex">
            Go home
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
