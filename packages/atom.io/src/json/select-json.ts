import { selector, type AtomToken, type SelectorToken } from "atom.io"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

export const selectJson = <T, J extends Json>(
  atom: AtomToken<T>,
  transform: JsonInterface<T, J>
): SelectorToken<J> =>
  selector({
    key: `${atom.key}JSON`,
    get: ({ get }) => transform.toJson(get(atom)),
    set: ({ set }, newValue) => set(atom, transform.fromJson(newValue)),
  })
