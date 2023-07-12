import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { registerSelector } from "./register-selector"
import type {
  FamilyMetadata,
  ReadonlySelectorOptions,
  ReadonlySelectorToken,
  Store,
} from "../.."
import { cacheValue } from "../operation"
import type { ReadonlySelector } from "../selector-internal"
import type { StoreCore } from "../store"

export const createReadonlySelector = <T>(
  options: ReadonlySelectorOptions<T>,
  family: FamilyMetadata | undefined,
  store: Store,
  core: StoreCore
): ReadonlySelectorToken<T> => {
  const subject = new Rx.Subject<{ newValue: T; oldValue: T }>()

  const { get, set } = registerSelector(options.key, store)
  const getSelf = () => {
    const value = options.get({ get })
    cacheValue(options.key, value, store)
    return value
  }

  const readonlySelector: ReadonlySelector<T> = {
    ...options,
    subject,
    get: getSelf,
    type: `readonly_selector`,
    ...(family && { family }),
  }
  core.readonlySelectors = HAMT.set(
    options.key,
    readonlySelector,
    core.readonlySelectors
  )
  const initialValue = getSelf()
  store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
  const token: ReadonlySelectorToken<T> = {
    key: options.key,
    type: `readonly_selector`,
    family,
  }
  store.subject.selectorCreation.next(token)
  return token
}
