import { lastOf } from "~/packages/anvl/src/array"
import type { FractalArray } from "~/packages/anvl/src/array/fractal-array"
import { now } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object"

import { addToIndex, removeFromIndex } from "."
import {
  makeSpaceLayoutNodeFamily,
  makeSpaceFamily,
  makeSpaceIndex,
  makeSpaceLayoutState,
} from "./space-states"
import type { View } from "./view-states"
import {
  makeViewFocusedState,
  makeViewFamily,
  makeViewIndex,
} from "./view-states"
import type {
  AtomFamily,
  AtomToken,
  ReadonlySelectorFamily,
  ReadonlySelectorToken,
  TransactionToken,
  Write,
} from ".."
import { selectorFamily, selector, transaction, atom } from ".."
import { persistAtom } from "../web-effects"

export const makeViewsPerSpaceState = (key: string): AtomToken<Join> =>
  atom<Join>({
    key: `${key}:views_per_space`,
    default: new Join({ relationType: `1:n` }),
    effects: [
      persistAtom<Join>(localStorage)({
        stringify: (index) => JSON.stringify(index.toJSON()),
        parse: (json) => Join.fromJSON(JSON.parse(json)),
      })(`${key}:views_per_space`),
    ],
  })

export const makeSpaceViewsFamily = (
  viewsPerSpaceState: AtomToken<Join>
): ReadonlySelectorFamily<string[], string> =>
  selectorFamily<string[], string>({
    key: `${viewsPerSpaceState.key}:space_views`,
    get:
      (spaceId) =>
      ({ get }) => {
        const join = get(viewsPerSpaceState)
        const viewIds = join.getRelatedIds(spaceId)
        return viewIds
      },
  })

type AddViewOptions = { spaceKey?: string; path?: string }
type SpaceLayoutNode = { childKeys: string[]; size: number }

export type ExplorerState = {
  addSpace: TransactionToken<(parentKey?: string) => string>
  addView: TransactionToken<(options?: AddViewOptions) => string>
  allViewsState: ReadonlySelectorToken<Entries<string, View>>
  findSpaceLayoutNode: ReadonlySelectorFamily<SpaceLayoutNode>
  findSpaceState: AtomFamily<string, string>
  findSpaceViewsState: ReadonlySelectorFamily<string[], string>
  findViewFocusedState: AtomFamily<number, string>
  findViewState: AtomFamily<View, string>
  removeSpace: TransactionToken<(id: string) => void>
  removeView: TransactionToken<(id: string) => void>
  spaceIndexState: AtomToken<Set<string>>
  spaceLayoutState: AtomToken<Join<{ size: number }>>
  viewIndexState: AtomToken<Set<string>>
  viewsPerSpaceState: AtomToken<Join>
  writeOperationAddSpace: Write<() => string>
  writeOperationAddView: Write<(options?: AddViewOptions) => void>
  writeOperationRemoveSpace: Write<(id: string) => void>
  writeOperationRemoveView: Write<(id: string) => void>
}

export const attachExplorerState = (key: string): ExplorerState => {
  const findSpaceState = makeSpaceFamily(key)
  const findViewState = makeViewFamily(key)
  const findViewFocusedState = makeViewFocusedState(key)
  const spaceIndexState = makeSpaceIndex(key)
  const spaceLayoutState = makeSpaceLayoutState(key)
  const viewIndexState = makeViewIndex(key)
  const viewsPerSpaceState = makeViewsPerSpaceState(key)

  const findSpaceLayoutNode = makeSpaceLayoutNodeFamily(spaceLayoutState)
  const findSpaceViewsState = makeSpaceViewsFamily(viewsPerSpaceState)

  const allViewsState = selector<Entries<string, View>>({
    key: `${key}:all_views`,
    get: ({ get }) => {
      const viewIndex = get(viewIndexState)
      return [...viewIndex].map((id) => [id, get(findViewState(id))])
    },
  })

  const writeOperationAddSpace: Write<(parentKey?: string) => string> = (
    transactors,
    parentKey = `root`
  ) => {
    const { set } = transactors
    const key = `s-${now()}`
    addToIndex(transactors, { indexAtom: spaceIndexState, id: key })
    set(spaceLayoutState, (current) =>
      current.set(`parent:${parentKey}`, key, { size: 1 })
    )
    set(findSpaceState(key), 1)
    return key
  }

  const writeOperationRemoveSpace: Write<(id: string) => void> = (
    transactors,
    id
  ) => {
    removeFromIndex(transactors, { indexAtom: spaceIndexState, id })
    transactors.set(findSpaceState(id), null)
  }

  const writeOperationAddView: Write<(options?: AddViewOptions) => void> = (
    transactors,
    { spaceKey: maybeSpaceId, path } = {}
  ) => {
    const { get, set } = transactors
    const id = `v-${now()}`

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
    set(viewsPerSpaceState, (current) => current.set(spaceId, id))
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
    key: `${key}:add_view`,
    do: writeOperationAddView,
  })

  const removeView = transaction({
    key: `${key}:remove_view`,
    do: writeOperationRemoveView,
  })

  const addSpace = transaction({
    key: `${key}:add_space`,
    do: writeOperationAddSpace,
  })

  const removeSpace = transaction({
    key: `${key}:remove_space`,
    do: writeOperationRemoveSpace,
  })

  return {
    addSpace,
    addView,
    allViewsState,
    findSpaceLayoutNode,
    findSpaceState,
    findSpaceViewsState,
    findViewState,
    findViewFocusedState,
    removeSpace,
    removeView,
    spaceIndexState,
    spaceLayoutState,
    viewIndexState,
    viewsPerSpaceState,
    writeOperationAddSpace,
    writeOperationAddView,
    writeOperationRemoveSpace,
    writeOperationRemoveView,
  }
}
