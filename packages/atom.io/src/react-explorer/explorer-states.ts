import { lastOf } from "~/packages/anvl/src/array"
import type { FractalArray } from "~/packages/anvl/src/array/fractal-array"
import { now } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object"

import { addToIndex, removeFromIndex } from "."
import {
  makeFindSpaceState,
  makeSpaceIndexState,
  makeSpaceLayoutState,
} from "./space-states"
import type { View } from "./view-states"
import { makeFindViewState, makeViewIndexState } from "./view-states"
import type {
  AtomFamily,
  AtomToken,
  ReadonlySelectorToken,
  TransactionToken,
  Write,
} from ".."
import { selector, transaction, atom } from ".."
import { persistAtom } from "../web-effects"

export const makeViewsPerSpaceState = (key: string): AtomToken<Join> =>
  atom<Join>({
    key: `${key}_explorer_views_per_space`,
    default: new Join({ relationType: `1:n` }),
    effects: [
      persistAtom<Join>(localStorage)({
        stringify: (index) => JSON.stringify(index.toJSON()),
        parse: (json) => Join.fromJSON(JSON.parse(json)),
      })(`viewsPerSpace`),
    ],
  })

export type ExplorerState = {
  findSpaceState: AtomFamily<string, string>
  spaceIndexState: AtomToken<Set<string>>
  spaceLayoutState: AtomToken<FractalArray<string>>
  writeOperationRemoveSpace: Write<(id: string) => void>
  writeOperationAddSpace: Write<() => string>
  findViewState: AtomFamily<View, string>
  viewIndexState: AtomToken<Set<string>>
  allViewsState: ReadonlySelectorToken<Entries<string, View>>
  writeOperationRemoveView: Write<(id: string) => void>
  writeOperationAddView: Write<
    (options?: { spaceId?: string; path?: string }) => void
  >
  removeView: TransactionToken<(id: string) => void>
  addView: TransactionToken<() => string>
  viewsPerSpaceState: AtomToken<Join>
}

export const attachExplorerState = (key: string): ExplorerState => {
  const findSpaceState = makeFindSpaceState(key)
  const spaceIndexState = makeSpaceIndexState(key)
  const spaceLayoutState = makeSpaceLayoutState(key)
  const viewsPerSpaceState = makeViewsPerSpaceState(key)
  const findViewState = makeFindViewState(key)
  const viewIndexState = makeViewIndexState(key)

  const allViewsState = selector<Entries<string, View>>({
    key: `${key}_explorer_all_views`,
    get: ({ get }) => {
      const viewIndex = get(viewIndexState)
      return [...viewIndex].map((id) => [id, get(findViewState(id))])
    },
  })

  const writeOperationAddSpace: Write<() => string> = (transactors) => {
    const { set } = transactors
    const id = `space-${now()}`
    addToIndex(transactors, { indexAtom: spaceIndexState, id })
    set(findSpaceState(id), 1)
    return id
  }

  const writeOperationRemoveSpace: Write<(id: string) => void> = (
    transactors,
    id
  ) => removeFromIndex(transactors, { indexAtom: spaceIndexState, id })

  type AddViewOptions = { spaceId?: string; path?: string }

  const writeOperationAddView: Write<(options?: AddViewOptions) => void> = (
    transactors,
    { spaceId: maybeSpaceId, path } = {}
  ) => {
    const { get, set } = transactors
    const id = `view-${now()}`

    addToIndex(transactors, { indexAtom: viewIndexState, id })
    set(
      findViewState(id),
      (current): View => ({
        ...current,
        location: {
          ...current.location,
          pathname: path ?? `/`,
        },
      })
    )
    const spaceId =
      maybeSpaceId ??
      lastOf([...get(spaceIndexState)]) ??
      writeOperationAddSpace(transactors)
    set(viewsPerSpaceState, (current) => {
      current.set(spaceId, id)
      return current
    })
  }

  const writeOperationRemoveView: Write<(id: string) => void> = (
    transactors,
    id
  ) => {
    const { set } = transactors
    removeFromIndex(transactors, { indexAtom: viewIndexState, id })
    set(viewsPerSpaceState, (current) => current.remove(id))
    set(findViewState(id), null)
  }

  const addView = transaction<(options?: AddViewOptions) => void>({
    key: `${key}_explorer_add_view`,
    do: writeOperationAddView,
  })

  const removeView = transaction({
    key: `${key}_explorer_remove_view`,
    do: writeOperationRemoveView,
  })

  return {
    findSpaceState,
    spaceIndexState,
    spaceLayoutState,
    writeOperationRemoveSpace,
    writeOperationAddSpace,
    findViewState,
    viewIndexState,
    allViewsState,
    writeOperationRemoveView,
    writeOperationAddView,
    removeView,
    addView,
    viewsPerSpaceState,
  }
}
