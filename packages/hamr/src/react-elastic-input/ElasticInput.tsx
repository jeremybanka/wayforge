import type { ChangeEventHandler, CSSProperties, Ref } from "react"
import { Component } from "react"

import type { EmotionJSX } from "@emotion/react/types/jsx-namespace"

/* eslint-disable max-lines */

const sizerStyle: CSSProperties = {
  position: `absolute`,
  top: 0,
  left: 0,
  visibility: `hidden`,
  height: 0,
  overflow: `scroll`,
  whiteSpace: `pre`,
}

const INPUT_PROPS_BLACKLIST = [
  `extraWidth`,
  // `injectStyles`,
  `inputClassName`,
  `inputRef`,
  `inputStyle`,
  `minWidth`,
  `onAutoSize`,
  `placeholderIsMinWidth`,
] as const

const cleanInputProps = (inputProps: ElasticInputProps) => {
  INPUT_PROPS_BLACKLIST.forEach((field) => delete inputProps[field])
  return inputProps
}

const copyStyles = (
  styles: CSSStyleDeclaration,
  node: HTMLDivElement | null
) => {
  if (node !== null) {
    node.style.fontSize = styles.fontSize
    node.style.fontFamily = styles.fontFamily
    node.style.fontWeight = styles.fontWeight
    node.style.fontStyle = styles.fontStyle
    node.style.letterSpacing = styles.letterSpacing
    node.style.textTransform = styles.textTransform
  }
}

// const isIE =
//   typeof window !== `undefined` && window.navigator
//     ? /MSIE |Trident\/|Edge\//.test(window.navigator.userAgent)
//     : false

// const generateId = () => {
//   // we only need an auto-generated ID for stylesheet injection, which is only
//   // used for IE. so if the browser is not IE, this should return undefined.
//   return isIE ? `_` + Math.random().toString(36).substr(2, 12) : undefined
// }

export type ElasticInputProps = {
  // injectStyles?: boolean
  className?: string
  defaultValue?: any
  disabled?: boolean
  extraWidth?: number
  id?: string
  inputClassName?: string
  inputRef?: (el: HTMLInputElement | null) => void
  inputStyle?: React.CSSProperties
  minWidth?: number | string
  onAutoSize?: (newWidth?: number | string) => void
  onChange?: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  placeholderIsMinWidth?: boolean
  style?: React.CSSProperties
  type?: string
  value?: any
}
export type ElasticInputState = {
  inputWidth?: number | string
  inputId?: string
  prevId?: string
}

export class ElasticInput extends Component<
  ElasticInputProps,
  ElasticInputState
> {
  public mounted = false

  public input: HTMLInputElement | null = null

  public sizer: HTMLDivElement | null = null

  public placeHolderSizer: HTMLDivElement | null = null

  public static getDerivedStateFromProps(
    props: ElasticInputProps,
    state: ElasticInputState
  ): ElasticInputState | null {
    const { id } = props
    return id !== state.prevId ? { inputId: id, prevId: id } : null
  }
  public constructor(props: ElasticInputProps) {
    super(props)
    this.state = {
      inputWidth: props.minWidth ?? 1,
      inputId: props.id,
      prevId: props.id,
    }
  }
  public componentDidMount(): void {
    this.mounted = true
    this.copyInputStyles()
    this.updateInputWidth()
  }
  public componentDidUpdate(
    _: ElasticInputProps,
    prevState: ElasticInputState
  ): void {
    if (prevState.inputWidth !== this.state.inputWidth) {
      if (typeof this.props.onAutoSize === `function`) {
        this.props.onAutoSize(this.state.inputWidth)
      }
    }
    this.updateInputWidth()
  }
  public componentWillUnmount(): void {
    this.mounted = false
  }
  public inputRef: Ref<HTMLInputElement> = (el): void => {
    this.input = el
    if (typeof this.props.inputRef === `function`) {
      this.props.inputRef(el)
    }
  }
  public placeHolderSizerRef: Ref<HTMLDivElement> = (el) => {
    this.placeHolderSizer = el
  }
  public sizerRef: Ref<HTMLDivElement> = (el) => {
    this.sizer = el
  }
  public copyInputStyles(): void {
    if (!this.mounted || !window.getComputedStyle) {
      return
    }
    const inputStyles = this.input && window.getComputedStyle(this.input)
    if (!inputStyles) {
      return
    }
    copyStyles(inputStyles, this.sizer)
    if (this.placeHolderSizer) {
      copyStyles(inputStyles, this.placeHolderSizer)
    }
  }
  public updateInputWidth(): void {
    if (!this.mounted || this.sizer === null) {
      return
    }
    let newInputWidth: number
    if (
      this.props.placeholder &&
      (!this.props.value ||
        (this.props.value && this.props.placeholderIsMinWidth))
    ) {
      newInputWidth =
        Math.max(
          this.sizer.scrollWidth,
          this.placeHolderSizer?.scrollWidth ?? 0
        ) + 2
    } else {
      newInputWidth = this.sizer.scrollWidth + 2
    }
    // add extraWidth to the detected width.
    // for number types, this defaults to 16 to allow for the stepper UI
    const extraWidth =
      this.props.type === `number` && this.props.extraWidth === undefined
        ? 16
        : this.props.extraWidth ?? 0
    newInputWidth += extraWidth
    if (newInputWidth < (this.props.minWidth ?? 0)) {
      newInputWidth = Number(this.props.minWidth)
    }
    if (newInputWidth !== this.state.inputWidth) {
      this.setState({
        inputWidth: newInputWidth,
      })
    }
  }
  public getInput(): HTMLInputElement | null {
    return this.input
  }
  public focus(): void {
    this.input?.focus()
  }
  public blur(): void {
    this.input?.blur()
  }
  public select(): void {
    this.input?.select()
  }
  // public renderStyles() {
  //   // this method injects styles to hide IE's clear indicator, which messes
  //   // with input size detection. the stylesheet is only injected when the
  //   // browser is IE, and can also be disabled by the `injectStyles` prop.
  //   const { injectStyles } = this.props
  //   return isIE && injectStyles ? (
  //     <style
  //       dangerouslySetInnerHTML={{
  //         __html: `input#${this.state.inputId}::-ms-clear {display: none;}`,
  //       }}
  //     />
  //   ) : null
  // }
  public render(): EmotionJSX.Element {
    const sizerValue = this.props.defaultValue ?? this.props.value ?? ``

    const wrapperStyle = { ...this.props.style }
    if (!wrapperStyle.display) wrapperStyle.display = `inline-block`

    const inputStyle: CSSProperties = {
      boxSizing: `content-box`,
      width: `${this.state.inputWidth}px`,
      ...this.props.inputStyle,
    }

    const { ...inputProps } = this.props
    cleanInputProps(inputProps)
    inputProps.className = this.props.inputClassName
    inputProps.id = this.state.inputId
    inputProps.style = inputStyle

    return (
      <span className={this.props.className} style={wrapperStyle}>
        {/* {this.renderStyles()} */}
        <input
          {...inputProps}
          ref={this.inputRef}
          disabled={this.props.disabled}
        />
        <div ref={this.sizerRef} style={sizerStyle}>
          {sizerValue}
        </div>
        {this.props.placeholder ? (
          <div ref={this.placeHolderSizerRef} style={sizerStyle}>
            {this.props.placeholder}
          </div>
        ) : null}
      </span>
    )
  }
}

/* eslint-disable max-len */
// AutosizeInput.propTypes = {
//   className: PropTypes.string, // className for the outer element
//   defaultValue: PropTypes.any, // default field value
//   extraWidth: PropTypes.oneOfType([
//     // additional width for input element
//     PropTypes.number,
//     PropTypes.string,
//   ]),
//   id: PropTypes.string, // id to use for the input, can be set for consistent snapshots
//   injectStyles: PropTypes.bool, // inject the custom stylesheet to hide clear UI, defaults to true
//   inputClassName: PropTypes.string, // className for the input element
//   inputRef: PropTypes.func, // ref callback for the input element
//   inputStyle: PropTypes.object, // css styles for the input element
//   minWidth: PropTypes.oneOfType([
//     // minimum width for input element
//     PropTypes.number,
//     PropTypes.string,
//   ]),
//   onAutosize: PropTypes.func, // onAutosize handler: function(newWidth) {}
//   onChange: PropTypes.func, // onChange handler: function(event) {}
//   placeholder: PropTypes.string, // placeholder text
//   placeholderIsMinWidth: PropTypes.bool, // don't collapse size to less than the placeholder
//   style: PropTypes.object, // css styles for the outer element
//   value: PropTypes.any, // field value
// }
/* eslint-enable max-len */
// AutoSizeInput.defaultProps = {
//   minWidth: 1,
//   injectStyles: true,
// }

// export default AutosizeInput
