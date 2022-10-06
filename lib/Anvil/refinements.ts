import type { Validator } from "Anvil"
import { isUndefined } from "Anvil"

import { content } from "./array"

export { content }

export const mightBeOrContainsOnly =
  <T>(isType: Validator<T>) =>
  (input: unknown): input is T | T[] | undefined =>
    isUndefined(input) || content(isType)(input)
