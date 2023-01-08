import { identity } from "fp-ts/function"

export type JsonStoreOptions = {
  formatResource?: (unformatted: string) => string
  baseDir: string
  logger: Pick<Console, `error` | `info` | `warn`>
}

export const DEFAULT_JSON_STORE_OPTIONS: JsonStoreOptions = {
  formatResource: identity,
  baseDir: `./json`,
  logger: console,
}
