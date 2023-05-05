import { isString } from "fp-ts/lib/string"

import type { FractalArray } from "~/packages/anvl/src/array/fractal-array"
import { isFractalArray } from "~/packages/anvl/src/array/fractal-array"
import { parseJson, stringifyJson } from "~/packages/anvl/src/json"

import { persistStringSetAtom } from "./explorer-effects"
import type { AtomToken } from ".."
import type { AtomFamily } from "../atom"
import { atom, atomFamily } from "../atom"
import { lazyLocalStorageEffect, persistAtom } from "../web-effects"

export const makeSpaceIndexState = (key: string): AtomToken<Set<string>> =>
  atom<Set<string>>({
    key: `${key}_explorer_space_index`,
    default: new Set(),
    effects: [persistStringSetAtom(`spaceIndex`)],
  })

export const makeSpaceLayoutState = (
  key: string
): AtomToken<FractalArray<string>> =>
  atom<FractalArray<string>>({
    key: `${key}_explorer_space_layout`,
    default: [],
    effects: [
      persistAtom<FractalArray<string>>(localStorage)({
        stringify: (array) => stringifyJson(array),
        parse: (string) => {
          try {
            const json = parseJson(string)
            const array = isFractalArray(isString)(json) ? json : []
            return array
          } catch (thrown) {
            console.error(`Error parsing spaceLayoutState from localStorage`)
            return []
          }
        },
      })(`spaceLayout`),
    ],
  })

export const makeFindSpaceState = (key: string): AtomFamily<number, string> =>
  atomFamily<number, string>({
    key: `${key}_explorer_space`,
    default: 1,
    effects: (id) => [lazyLocalStorageEffect(id)],
  })
