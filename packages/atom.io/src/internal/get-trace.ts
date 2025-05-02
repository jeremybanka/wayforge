export function getTrace(error: Error): string {
	const { stack } = error
	if (stack) {
		return `\n` + stack.split(`\n`)?.slice(1)?.join(`\n`)
	}
	return ``
}
