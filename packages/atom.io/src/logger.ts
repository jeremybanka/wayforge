import { IMPLICIT } from "atom.io/internal"
import type { Store } from "atom.io/internal"

export const NO_OP = (): void => undefined

export type Logger = Pick<Console, `error` | `info` | `warn`>
export const LOG_LEVELS: ReadonlyArray<keyof Logger> = [
	`info`,
	`warn`,
	`error`,
] as const

export const setLogLevel = (
	preferredLevel: `error` | `info` | `warn` | null,
	store: Store = IMPLICIT.STORE,
): void => {
	const { logger__INTERNAL } = store.config
	if (preferredLevel === null) {
		store.config.logger = null
	} else {
		store.config.logger = { ...console }
		for (const logLevel of LOG_LEVELS) {
			if (LOG_LEVELS.indexOf(logLevel) < LOG_LEVELS.indexOf(preferredLevel)) {
				// biome-ignore lint/style/noNonNullAssertion: we just set it
				store.config.logger![logLevel] = NO_OP
			} else {
				// biome-ignore lint/style/noNonNullAssertion: we just set it
				store.config.logger![logLevel] = logger__INTERNAL[logLevel]
			}
		}
	}
}

export const useLogger = (
	logger: Logger,
	store: Store = IMPLICIT.STORE,
): void => {
	const currentLogLevel =
		store.config.logger === null
			? null
			: LOG_LEVELS.find(
					(logLevel) => store.config.logger?.[logLevel] !== NO_OP,
			  ) ?? null
	store.config.logger__INTERNAL = { ...logger }
	setLogLevel(currentLogLevel, store)
}
