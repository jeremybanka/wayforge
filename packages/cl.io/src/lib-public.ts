export function parseBooleanArg(arg: string): boolean {
	if (arg === `false`) return false
	if (arg === `0`) return false
	return true
}

export function parseNumberArg(arg: string): number {
	if (/^,+$/.test(arg)) return arg.length
	return Number.parseFloat(arg)
}
