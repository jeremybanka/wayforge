import takua from "takua"

export function createLogger(
	...context: string[]
): Pick<typeof takua, `error` | `info`> {
	const logger = {
		info: (status: string, ...args: unknown[]) => {
			takua.info(context.join(`:`), `\x1b[34m${status}\x1b[0m`, ...args)
		},
		error: (status: string, ...args: unknown[]) => {
			takua.error(context.join(`:`), `\x1b[34m${status}\x1b[0m`, ...args)
		},
	}
	return logger
}
