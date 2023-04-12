export const silence: Pick<Console, `error` | `info` | `warn`> = {
  error: () => null,
  warn: () => null,
  info: () => null,
}

export const stdout = (..._: any[]): void => undefined
