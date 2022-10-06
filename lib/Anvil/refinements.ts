import type { Validator } from "."
import { content } from "./array"
import { isUndefined } from "./nullish"

export { content }

export const mightBeOrContainsOnly =
  <T>(isType: Validator<T>) =>
  (input: unknown): input is T | T[] | undefined =>
    isUndefined(input) || content(isType)(input)
