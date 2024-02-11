import type { FunctionComponent } from "react"

const NOT_A_FUNCTION = true
// @ts-expect-error (that's the point)
export const throwTypeError = (): never => NOT_A_FUNCTION()
export const ThrowOnRender: FunctionComponent = () => throwTypeError()
