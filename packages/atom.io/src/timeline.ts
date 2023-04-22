import type { AtomFamily, AtomToken } from "."

export type TimelineToken = {
  key: string
  type: `timeline`
}

export type Timeline = {
  key: string
  type: `timeline`
  next: () => void
  prev: () => void
}

export const timeline = (options: {
  key: string
  atoms: Record<string, AtomFamily<any> | AtomToken<any>>
}): TimelineToken => {
  const { atoms } = options
  const keys = Object.keys(atoms)
  const key = keys.join(` + `)
  return { key, type: `timeline` } as TimelineToken
}
