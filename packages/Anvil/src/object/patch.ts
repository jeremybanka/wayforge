import { isPlainObject, key } from "."
import { sprawl } from "./sprawl"

export type Fragment<T> = Partial<{
  [K in keyof T]: T[K] extends object ? Fragment<T[K]> : T[K]
}>

export const patch = <Base extends object, Update extends Fragment<Base>>(
  base: Base,
  update: Update
): Base => {
  const result = { ...base }
  sprawl(update, (path, node) => {
    if (path.length === 0) return
    const target = path.reduce((acc, part) => key(part)(acc), result)
    if (Array.isArray(target) && Array.isArray(node)) {
      target.push(...node)
    }
    if (isPlainObject(target) && isPlainObject(node)) {
      Object.assign(target, node)
    }
  })
  return result
}
