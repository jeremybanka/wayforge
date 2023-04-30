import type {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ChangeEventHandler,
} from "react"
import {
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useEffect,
} from "react"

export const ElasticInput = forwardRef<
  HTMLInputElement,
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    widthPadding?: number
  }
>(function ElasticInputFC(props, ref) {
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState(`auto`)

  useImperativeHandle<
    Partial<HTMLInputElement>,
    Partial<HTMLInputElement>
  >(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
  }))

  const extraWidth = props.type === `number` ? 15 : 0

  useLayoutEffect(() => {
    if (spanRef.current) {
      setInputWidth(`${spanRef.current.offsetWidth + extraWidth}px`)
      const interval = setInterval(() => {
        if (spanRef.current) {
          setInputWidth(`${spanRef.current.offsetWidth + extraWidth}px`)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [inputRef.current?.value, props.value])

  return (
    <div style={{ display: `inline-block`, position: `relative` }}>
      <input
        {...props}
        ref={inputRef}
        style={{
          padding: 0,
          borderRadius: 0,
          border: `none`,
          fontFamily: `inherit`,
          fontSize: `inherit`,
          width: inputWidth,
          ...props.style,
        }}
      />
      <span
        ref={spanRef}
        style={{
          padding: props.style?.padding,
          position: `absolute`,
          visibility: `hidden`,
          // color: `red`,
          whiteSpace: `pre`,
          fontFamily: props.style?.fontFamily || `inherit`,
          fontSize: props.style?.fontSize || `inherit`,
        }}
      >
        {props.value}
      </span>
    </div>
  )
})
