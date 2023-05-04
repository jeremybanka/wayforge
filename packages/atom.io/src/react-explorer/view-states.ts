import type { Location } from "react-router-dom"

import { persistStringSetAtom } from "./explorer-effects"
import type { AtomToken } from ".."
import type { AtomFamily } from "../atom"
import { atom, atomFamily } from "../atom"
import { lazyLocalStorageEffect } from "../web-effects"

export type View = {
  title: string
  location: Omit<Location, `state`>
}

export const makeFindViewState = (key: string): AtomFamily<View, string> =>
  atomFamily<View, string>({
    key: `${key}_explorer_view`,
    default: {
      title: ``,
      location: {
        pathname: ``,
        search: ``,
        hash: ``,
        key: ``,
      },
    },
    effects: (id) => [lazyLocalStorageEffect(id)],
  })

export const makeViewIndexState = (key: string): AtomToken<Set<string>> =>
  atom<Set<string>>({
    key: `${key}_explorer_view_index`,
    default: new Set(),
    effects: [persistStringSetAtom(`viewIndex`)],
  })
