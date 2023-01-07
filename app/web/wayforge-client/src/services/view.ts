import { useEffect } from "react"

import type { Location } from "react-router-dom"
import { useLocation } from "react-router-dom"
import {
  atom,
  atomFamily,
  selector,
  useRecoilTransaction_UNSTABLE as useRecoilTransaction,
  useRecoilValue,
  useSetRecoilState,
} from "recoil"

import { lastOf } from "~/packages/Anvil/src/array"
import { now } from "~/packages/Anvil/src/id/now"
import { Join } from "~/packages/Anvil/src/join"
import type { Entries } from "~/packages/Anvil/src/object"
import {
  localStorageEffect,
  localStorageSerializationEffect,
} from "~/packages/Hammer/recoil-tools/effects/local-storage"
import {
  addToIndex,
  removeFromIndex,
} from "~/packages/Hammer/recoil-tools/recoil-index"
import type { TransactionOperation } from "~/packages/Hammer/recoil-tools/recoil-utils"

export const spaceIndexState = atom<Set<string>>({
  key: `spaceIndex`,
  default: new Set(),
  effects: [
    localStorageSerializationEffect(`spaceIndex`, {
      serialize: (set) => JSON.stringify([...set]),
      deserialize: (json) => new Set(JSON.parse(json)),
    }),
  ],
})

type InfinitelyNestedArray<T> = InfinitelyNestedArray<T>[] | T

export const spaceLayoutState = atom<InfinitelyNestedArray<string>>({
  key: `spaceLayout`,
  default: [],
  effects: [localStorageEffect(`spaceLayout`)],
})

const findSpaceState = atomFamily<number, string>({
  key: `space`,
  default: 1,
  effects: (id) => [localStorageEffect(id)],
})

export const addSpace: TransactionOperation<undefined, string> = (
  transactors
) => {
  const { set } = transactors
  const id = `space-${now()}`
  addToIndex(transactors, { indexAtom: spaceIndexState, id })
  set(findSpaceState(id), 1)
  return id
}

export const removeSpace: TransactionOperation<string> = (transactors, id) =>
  removeFromIndex(transactors, { indexAtom: spaceIndexState, id })

export const viewsPerSpaceState = atom<Join>({
  key: `viewsPerSpace`,
  default: new Join({ relationType: `1:n` }),
  effects: [
    localStorageSerializationEffect(`viewsPerSpace`, {
      serialize: (index) => JSON.stringify(index.toJSON()),
      deserialize: (json) => Join.fromJSON(JSON.parse(json)),
    }),
  ],
})

export type View = {
  title: string
  location: Location
}

export const findViewState = atomFamily<View, string>({
  key: `view`,
  default: {
    title: ``,
    location: {
      pathname: ``,
      search: ``,
      hash: ``,
      state: undefined,
      key: ``,
    },
  },
  effects: (id) => [
    localStorageSerializationEffect(id, {
      serialize: (view) => JSON.stringify(view),
      deserialize: (json) => JSON.parse(json),
    }),
  ],
})

export const viewIndexState = atom<Set<string>>({
  key: `viewIndex`,
  default: new Set(),
  effects: [
    localStorageSerializationEffect(`viewIndex`, {
      serialize: (set) => JSON.stringify([...set]),
      deserialize: (json) => new Set(JSON.parse(json)),
    }),
  ],
})

export const allViewsState = selector<Entries<string, View>>({
  key: `allViews`,
  get: ({ get }) => {
    const viewIndex = get(viewIndexState)
    return [...viewIndex].map((id) => [id, get(findViewState(id))])
  },
})

export const useSetTitle = (title: string): void => {
  const location = useLocation()
  const views = useRecoilValue(allViewsState)
  const locationView = views.find(
    ([, view]) => view.location.key === location.key
  )
  const viewId = locationView?.[0] ?? ``
  const setView = useSetRecoilState(findViewState(viewId))
  useEffect(() => {
    setView((v) => ({ ...v, title }))
  }, [title, setView])
}

type AddViewOptions = { spaceId?: string; path?: string }

const addView: TransactionOperation<AddViewOptions | undefined> = (
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
        state: { id },
      },
    })
  )
  const spaceId =
    maybeSpaceId ?? lastOf([...get(spaceIndexState)]) ?? addSpace(transactors)
  set(viewsPerSpaceState, (current) => {
    current.set(spaceId, id)
    return current
  })
}

export const useOperation = <Options>(
  operation: TransactionOperation<Options>
): ((...args: Options extends undefined ? [] : [Options]) => void) =>
  useRecoilTransaction(
    (transactors) =>
      (...args) =>
        operation(transactors, ...args)
  )

export const useAddView = (): ((options?: AddViewOptions) => void) =>
  useRecoilTransaction(
    (transactors) => (options) => addView(transactors, options)
  )

const removeView: TransactionOperation<string> = (transactors, id) => {
  const { set } = transactors
  removeFromIndex(transactors, { indexAtom: viewIndexState, id })
  set(viewsPerSpaceState, (current) => current.remove(id))
}

export const useRemoveView = (): ((id: string) => void) =>
  useRecoilTransaction((transactors) => (id) => removeView(transactors, id))
