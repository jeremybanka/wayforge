import type { Fn } from "./utility-types"

const NON_CTOR_FN_REGEX =
	/^\[object (?:Async|Generator|AsyncGenerator)?Function\]$/

export function isFn(input: unknown): input is Fn {
	const protoString = Object.prototype.toString.call(input)
	return NON_CTOR_FN_REGEX.test(protoString)
}
