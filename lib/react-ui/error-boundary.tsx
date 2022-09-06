import type { ErrorInfo, ReactNode, FC, FunctionComponent } from "react"
import { Component } from "react"

export type FallbackProps = {
  error?: Error | string
  errorInfo?: ErrorInfo
}

const NOT_A_FUNCTION = true
// @ts-expect-error 😂😂😂
const throwTypeError = (): never => NOT_A_FUNCTION()

export const OOPS: FunctionComponent = () => throwTypeError()

export const DefaultFallback: FC<FallbackProps> = ({ error, errorInfo }) => {
  const component = errorInfo?.componentStack.split(` `).filter(Boolean)[2]
  const message =
    error?.toString() ?? errorInfo?.componentStack ?? `Unknown error`
  return (
    <div
      style={{
        flex: `1`,
        background: `black`,
        backgroundImage: `url(./src/assets/kablooey.gif)`,
        backgroundPosition: `center`,
        // backgroundRepeat: `no-repeat`,
        backgroundSize: `overlay`,
      }}
    >
      {/* <img src="./src/assets/kablooey.gif" alt="error" /> */}
      <div
        style={{
          margin: `50px`,
          marginTop: `0`,
          padding: `50px`,
          border: `1px solid dashed`,
        }}
      >
        <span
          style={{
            background: `black`,
            color: `white`,
            padding: 10,
            paddingTop: 5,
          }}
        >
          {` ⚠️ `}
          <span style={{ color: `#fc0`, fontWeight: 700 }}>{component}</span>
          {` ⚠️ `}
          {message}
        </span>
      </div>
    </div>
  )
}

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
