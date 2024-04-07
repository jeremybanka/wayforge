export function parseBooleanOption(arg: string): boolean {
	if (arg === `false`) return false
	if (arg === `0`) return false
	return true
}

export function parseNumberOption(arg: string): number {
	if (arg === ``) return 1
	if (/^,+$/.test(arg)) return arg.length + 1
	return Number.parseFloat(arg)
}

export function parseStringOption(arg: string): string {
	return arg
}
