export const REQUIRED = `required` as const
export const OPTIONAL = `optional` as const

export function parseBooleanArg(arg: string): boolean {
	if (arg === `false`) return false
	if (arg === `0`) return false
	return true
}

export function parseNumberArg(arg: string): number {
	if (arg === ``) return 1
	if (/^,+$/.test(arg)) return arg.length + 1
	return Number.parseFloat(arg)
}

export function parseStringArg(arg: string): string {
	return arg
}
