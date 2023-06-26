import { lastOf } from "~/packages/anvl/src/array"
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
  makeViewFocusedFamily,
  makeViewFamily,
  makeViewIndex,
} from "./view-states"
import type {
  AtomFamily,
  AtomToken,
  ReadonlySelectorFamily,
  SelectorFamily,
  Write,
} from ".."
import { selectorFamily, selector, transaction, atom } from ".."
import { persistAtom } from "../web-effects"

export const makeViewsPerSpaceState = (
  key: string
): AtomToken<Join<null, `viewId`, `spaceId`>> =>
  atom<Join<null, `viewId`, `spaceId`>>({
    key: `${key}:views_per_space`,
    default: new Join({ relationType: `1:n` }),
    effects: [
      persistAtom<Join<null, `viewId`, `spaceId`>>(localStorage)({
        stringify: (index) => JSON.stringify(index.toJSON()),
        parse: (json) =>
          Join.fromJSON(JSON.parse(json), {
            from: `viewId`,
            to: `spaceId`,
          }),
      })(`${key}:views_per_space`),
    ],
  })

export const makeSpaceViewsFamily = (
  key: string,
  viewsPerSpaceState: AtomToken<Join<null, `viewId`, `spaceId`>>
): ReadonlySelectorFamily<string[], string> =>
  selectorFamily<string[], string>({
    key: `${key}:space_views`,
    get:
      (spaceId) =>
      ({ get }) => {
        const join = get(viewsPerSpaceState)
        const viewIds = join.getRelatedIds(spaceId)
        return viewIds
      },
  })

export const makeSpaceFocusedViewFamily = (
  key: string,
  findSpaceViewsState: ReadonlySelectorFamily<string[], string>,
  findViewFocusedState: AtomFamily<number, string>
): SelectorFamily<string | null, string> =>
  selectorFamily<string | null, string>({
    key: `${key}:space_focused_view`,
    get:
      (spaceKey) =>
      ({ get }) => {
        const views = get(findSpaceViewsState(spaceKey))
        const viewsLastFocused = views.map((viewKey): [string, number] => [
          viewKey,
          get(findViewFocusedState(viewKey)),
        ])
        const lastFocused = lastOf(viewsLastFocused.sort((a, b) => b[1] - a[1]))
        return lastFocused ? lastFocused[0] : null
      },
    set:
      (spaceKey) =>
      ({ get, set }, viewKey) => {
        if (viewKey === null) {
          return
        }
        const views = get(findSpaceViewsState(spaceKey))
        if (views.includes(viewKey)) {
          set(findViewFocusedState(viewKey), Date.now())
        } else {
          console.warn(`View ${viewKey} not found in space ${spaceKey}`)
        }
      },
  })

type AddViewOptions = { spaceId?: string; path?: string }
type SplitSpaceOptions = { parentId?: string }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const attachExplorerState = (key: string) => {
  const findSpaceState = makeSpaceFamily(key)
  const findViewState = makeViewFamily(key)
  const findViewFocusedState = makeViewFocusedFamily(key)
  const spaceIndexState = makeSpaceIndex(key)
  const spaceLayoutState = makeSpaceLayoutState(key)
  const viewIndexState = makeViewIndex(key)
  const viewsPerSpaceState = makeViewsPerSpaceState(key)

  const findSpaceLayoutNode = makeSpaceLayoutNodeFamily(key, spaceLayoutState)
  const findSpaceViewsState = makeSpaceViewsFamily(key, viewsPerSpaceState)
  const findSpaceFocusedViewState = makeSpaceFocusedViewFamily(
    key,
    findSpaceViewsState,
    findViewFocusedState
  )

  const allViewsState = selector<Entries<string, View>>({
    key: `${key}:all_views`,
    get: ({ get }) => {
      const viewIndex = get(viewIndexState)
      return [...viewIndex].map((id) => [id, get(findViewState(id))])
    },
  })

  const writeOperationAddSpace: Write<
    (options?: SplitSpaceOptions) => string
  > = (transactors, { parentId = `root` } = {}) => {
    const { set } = transactors
    const key = `s-${now()}`
    addToIndex(transactors, { indexAtom: spaceIndexState, id: key })
    set(spaceLayoutState, (current) =>
      current.set({ parent: `parent:${parentId}`, child: key }, { size: 1 })
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
    { spaceId: maybeSpaceId, path } = {}
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
    set(findViewFocusedState(id), Date.now())

    set(viewsPerSpaceState, (current) => current.set({ spaceId, viewId: id }))
    set(findViewFocusedState(id), Date.now())
  }

  const writeOperationRemoveView: Write<(viewId: string) => void> = (
    transactors,
    viewId
  ) => {
    const { set } = transactors
    removeFromIndex(transactors, { indexAtom: viewIndexState, id: viewId })
    set(viewsPerSpaceState, (current) => current.remove({ viewId }))
    set(findViewState(viewId), null)
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
    findSpaceFocusedViewState,
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
