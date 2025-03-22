"use client"

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error:", error)
    console.error("Component stack:", errorInfo.componentStack)
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Rendering Error!</strong>
          <span className="block sm:inline ml-1">Something went wrong.</span>
          <pre className="mt-2 text-sm bg-red-50 p-2 rounded overflow-auto">
            <strong>Error: </strong>{this.state.error?.message || "Unknown error"}
            <br />
            <strong>Stack: </strong>{this.state.error?.stack || "No stack trace available"}
            <br />
            <strong>Component Stack: </strong>{this.state.errorInfo?.componentStack || "No component stack available"}
          </pre>
          <button 
            className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
} 