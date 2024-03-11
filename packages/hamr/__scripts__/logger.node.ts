import npmlog from "npmlog"

export function createLogger(
	...context: string[]
): Pick<typeof npmlog, `error` | `info`> {
	const logger = {
		info: (status: string, ...args: unknown[]) => {
			npmlog.info(context.join(`:`), `\x1b[34m${status}\x1b[0m`, ...args)
		},
		error: (status: string, ...args: unknown[]) => {
			npmlog.error(context.join(`:`), `\x1b[34m${status}\x1b[0m`, ...args)
		},
	}
	return logger
}
