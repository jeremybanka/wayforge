export * as Json from "./json"

export type Refinement<T, U extends T> = (value: T) => value is U

export type Cardinality = `1:1` | `1:n` | `n:n`
