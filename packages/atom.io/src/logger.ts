import { doNothing } from "~/packages/anvl/src/function"

import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"

export type Logger = Pick<Console, `error` | `info` | `warn`>
export const LOG_LEVELS: ReadonlyArray<keyof Logger> = [
  `info`,
  `warn`,
  `error`,
] as const

export const setLogLevel = (
  preferredLevel: `error` | `info` | `warn` | null,
  store: Store = IMPLICIT.STORE
): void => {
  const { logger__INTERNAL } = store.config
  if (preferredLevel === null) {
    store.config.logger = null
  } else {
    store.config.logger = { ...console }
    LOG_LEVELS.forEach((logLevel) => {
      if (LOG_LEVELS.indexOf(logLevel) < LOG_LEVELS.indexOf(preferredLevel)) {
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        store.config.logger![logLevel] = doNothing
      } else {
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        store.config.logger![logLevel] = logger__INTERNAL[logLevel]
      }
    })
  }
}

export const useLogger = (
  logger: Logger,
  store: Store = IMPLICIT.STORE
): void => {
  const currentLogLevel =
    store.config.logger === null
      ? null
      : LOG_LEVELS.find(
          (logLevel) => store.config.logger?.[logLevel] !== doNothing
        ) ?? null
  store.config.logger__INTERNAL = { ...logger }
  setLogLevel(currentLogLevel, store)
}
