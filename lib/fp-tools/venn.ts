export type VennQuery = (
  items: ReadonlyArray<unknown> | unknown[]
) => (array: ReadonlyArray<unknown> | unknown[]) => boolean

export type VennTally = (
  items: ReadonlyArray<unknown> | unknown[]
) => (array: ReadonlyArray<unknown> | unknown[]) => number

export const includesAll: VennQuery = (items) => (array) => {
  for (const item of items) {
    if (!array.includes(item)) return false
  }
  return true
}

export const includesAny: VennQuery = (items) => (array) => {
  for (const item of items) {
    if (array.includes(item)) return true
  }
  return false
}

export const excludesAll: VennQuery = (items) => (array) =>
  !includesAny(items)(array)

export const excludesAny: VennQuery = (items) => (array) =>
  !includesAll(items)(array)

export const comprises: VennQuery = (items) => (array) =>
  includesAll(items)(array) && includesAll(array)(items)

export const overlaps: VennTally = (items) => (array) => {
  let incidences = 0
  for (const item of items) {
    if (array.includes(item)) incidences += 1
  }
  return incidences
}
