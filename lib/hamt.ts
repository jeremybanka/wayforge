import type { Hamt } from "hamt_plus"
import inventory from "hamt_plus"

export const hamtToRecord = <T>(hamt: Hamt<T>): Record<string, T> => {
  const json = {} as Record<string, T>
  for (const [key, value] of hamt.entries()) {
    json[key] = value
  }
  return json
}

export const recordToHamt = <T>(json: Record<string, T>): Hamt<T> => {
  let hamt = inventory.make<T>()
  for (const [key, value] of Object.entries(json)) {
    hamt = hamt.set(key, value)
  }
  return hamt
}
