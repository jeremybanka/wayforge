/* eslint-disable @typescript-eslint/strict-boolean-expressions */
export const throwWhile = (v: unknown): void => {
	if (v) throw new Error(`Expected value to be falsy`)
}
export const throwUntil = (v: unknown): void => {
	if (!v) throw new Error(`Expected value to be truthy`)
}
