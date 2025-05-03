// Create this file: app/error-boundary.tsx
"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Capture the error
    console.error("Error captured by ErrorBoundary:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with full stack trace
    console.error("Error Stack Trace:", error);
    console.error("Component Stack:", errorInfo.componentStack);

    // If it's the infinite loop error, we can extract more info
    if (error.message.includes("Maximum update depth exceeded")) {
      console.error("INFINITE LOOP DETECTED!");
      console.error("This usually happens due to:");
      console.error("1. useEffect without dependency array");
      console.error("2. State updates causing infinite renders");
      console.error("3. Context providers causing circular updates");

      // Save the error to session storage for analysis
      sessionStorage.setItem(
        "infiniteLoopError",
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  componentDidMount() {
    // Log any stored errors
    const storedError = sessionStorage.getItem("infiniteLoopError");
    if (storedError) {
      console.log("Previous infinite loop error:", JSON.parse(storedError));
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            border: "1px solid red",
            borderRadius: "5px",
            backgroundColor: "#ffe6e6",
            margin: "20px",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ color: "red" }}>Application Error Detected</h2>
          <h3>Error Message:</h3>
          <pre>{this.state.error?.message}</pre>
          <h3>Actions to take:</h3>
          <ul>
            <li>Check the console for detailed logs</li>
            <li>Look for recent changes that might be causing loops</li>
            <li>Check all useEffect hooks for proper dependency arrays</li>
          </ul>
          <button
            onClick={() => {
              sessionStorage.removeItem("infiniteLoopError");
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Reload Application
          </button>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4444ff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginLeft: "10px",
              marginTop: "10px",
            }}
          >
            Try to Continue
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
