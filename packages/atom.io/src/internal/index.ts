import type * as Rx from "rxjs"

export * from "./get"
export * from "./set"
export * from "./store"
export * from "./operation"
export * from "./transaction-internal"

export type Atom<T> = {
  key: string
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  default: T
}
export type Selector<T> = {
  key: string
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = Omit<Selector<T>, `set`>
