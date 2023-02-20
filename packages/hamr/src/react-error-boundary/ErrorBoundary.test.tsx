import type { FunctionComponent } from "react"

const NOT_A_FUNCTION = true
// @ts-expect-error 😂😂😂
const throwTypeError = (): never => NOT_A_FUNCTION()
export const OOPS: FunctionComponent = () => throwTypeError()
