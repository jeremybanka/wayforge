import { identity } from "fp-ts/lib/function"

export type FilestoreOptions = {
  formatResource?: (unformatted: string) => string
  baseDir: string
  logger: Pick<Console, `error` | `info` | `warn`>
}

export const DEFAULT_FILESTORE_OPTIONS: FilestoreOptions = {
  formatResource: identity,
  baseDir: `json`,
  logger: console,
}
