export type primitive = boolean | number | string | null

export const isString = (input: unknown): input is string => {
	return typeof input === `string`
}

export const isNumber = (input: unknown): input is number => {
	return typeof input === `number`
}

export const isBoolean = (input: unknown): input is boolean => {
	return typeof input === `boolean`
}

export const isNull = (input: unknown): input is null => {
	return input === null
}

export const isPrimitive = (input: unknown): input is primitive => {
	return isString(input) || isNumber(input) || isBoolean(input) || isNull(input)
}
