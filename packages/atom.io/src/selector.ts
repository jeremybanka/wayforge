import type * as Rx from "rxjs"

import type { Serializable } from "~/packages/anvl/src/json"

import type { ReadonlySelectorToken, SelectorToken } from "."
import { selectorFamily__INTERNAL, selector__INTERNAL } from "./internal"
import type { Read, Write } from "./transaction"

export type SelectorOptions<T> = {
  key: string
  get: Read<() => T>
  set: Write<(newValue: T) => void>
}
export type ReadonlySelectorOptions<T> = Omit<SelectorOptions<T>, `set`>

export function selector<T>(
  options: ReadonlySelectorOptions<T>
): ReadonlySelectorToken<T>
export function selector<T>(options: SelectorOptions<T>): SelectorToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>
): ReadonlySelectorToken<T> | SelectorToken<T> {
  return selector__INTERNAL(options)
}

export type SelectorFamilyOptions<T, K extends Serializable> = {
  key: string
  get: (key: K) => Read<() => T>
  set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlySelectorFamilyOptions<T, K extends Serializable> = Omit<
  SelectorFamilyOptions<T, K>,
  `set`
>

export type SelectorFamily<T, K extends Serializable = Serializable> = ((
  key: K
) => SelectorToken<T>) & {
  key: string
  type: `selector_family`
  subject: Rx.Subject<SelectorToken<T>>
}

export type ReadonlySelectorFamily<T, K extends Serializable = Serializable> = ((
  key: K
) => ReadonlySelectorToken<T>) & {
  key: string
  type: `readonly_selector_family`
  subject: Rx.Subject<ReadonlySelectorToken<T>>
}

export function selectorFamily<T, K extends Serializable>(
  options: SelectorFamilyOptions<T, K>
): SelectorFamily<T, K>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K>
): ReadonlySelectorFamily<T, K>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
  return selectorFamily__INTERNAL(options)
}
