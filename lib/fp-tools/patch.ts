import { isPlainObject } from "./object"
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
    if (path === ``) return
    const [_, ...pathParts] = path.split(`/`)
    const target = pathParts.reduce((acc, part) => acc?.[part], result)
    if (Array.isArray(target) && Array.isArray(node)) {
      target.push(...node)
    }
    if (isPlainObject(target) && isPlainObject(node)) {
      Object.assign(target, node)
    }
  })
  return result
}
