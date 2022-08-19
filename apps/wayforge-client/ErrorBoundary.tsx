import type { ErrorInfo, ReactNode, FC } from "react"
import React, { Component } from "react"

export type FallbackProps = {
  error?: Error | string
  errorInfo?: ErrorInfo
}

export const DefaultFallback: FC<FallbackProps> = ({ error, errorInfo }) => (
  <div style={{ flex: `1` }}>
    <img src="./assets/kablooey.gif" alt="error" />
    <div
      style={{
        margin: `50px`,
        marginTop: `0`,
        padding: `50px`,
        border: `1px solid dashed`,
      }}
    >
      <h2>😱 Uh Oh.</h2>
      <br />
      {error?.toString()}
      <details style={{ whiteSpace: `pre-wrap` }}>
        {errorInfo?.componentStack}
      </details>
    </div>
  </div>
)

type ClockState = {
  error?: Error | string
  errorInfo?: ErrorInfo
}

type ErrorBoundaryProps = {
  [key: string]: unknown
  children: ReactNode
  Fallback?: FC<FallbackProps>
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ClockState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: undefined, errorInfo: undefined }
    // We can filter or add information
    // to airbrake notifications here:
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    })
  }

  public override render(): ReactNode {
    const { error, errorInfo } = this.state
    const { children, Fallback = DefaultFallback } = this.props

    return errorInfo ? (
      <Fallback error={error} errorInfo={errorInfo} />
    ) : (
      (children as ReactNode)
    )
  }
}
