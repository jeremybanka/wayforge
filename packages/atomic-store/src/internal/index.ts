import type * as Rx from "rxjs"

export * from "./get"
export * from "./set"
export * from "./store"

export type Atom<T> = {
  key: string
  subject: Rx.Subject<T>
  default: T
}
export type Selector<T> = {
  key: string
  subject: Rx.Subject<T>
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = Omit<Selector<T>, `set`>
