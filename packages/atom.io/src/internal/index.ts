import type * as Rx from "rxjs"

import type { FamilyMetadata } from ".."

export * from "./get"
export * from "./set"
export * from "./is-default"
export * from "./selector-internal"
export * from "./store"
export * from "./subscribe-internal"
export * from "./operation"
export * from "./transaction-internal"

export type Atom<T> = {
  key: string
  type: `atom`
  family?: FamilyMetadata
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  default: T
}
export type Selector<T> = {
  key: string
  type: `selector`
  family?: FamilyMetadata
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = {
  key: string
  type: `readonly_selector`
  family?: FamilyMetadata
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  get: () => T
}
