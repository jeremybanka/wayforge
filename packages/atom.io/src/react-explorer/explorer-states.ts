import { useEffect } from "react"

import type { Location } from "react-router-dom"
import { useLocation } from "react-router-dom"

import { lastOf } from "~/packages/anvl/src/array"
import { now } from "~/packages/anvl/src/id/now"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object/entries"
import { atom, atomFamily, selector, transaction } from "~/packages/atom.io/src"
import type { Write, AtomToken } from "~/packages/atom.io/src"
import {
  localStorageEffect,
  localStorageSerializationEffect,
} from "~/packages/hamr/src/recoil-effect-storage/local-storage"

export type AtomicIndexOptions = {
  indexAtom: AtomToken<Set<string>>
  id: string
}

export const addToIndex: Write<(options: AtomicIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void => set(indexAtom, (currentSet) => new Set(currentSet).add(id))

export const removeFromIndex: Write<(options: AtomicIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void =>
  set(indexAtom, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.delete(id)
    return newSet
  })

export const spaceIndexState = atom<Set<string>>({
  key: `spaceIndex`,
  default: new Set(),
  // effects: [
  //   localStorageSerializationEffect(`spaceIndex`, {
  //     serialize: (set) => JSON.stringify([...set]),
  //     deserialize: (json) => new Set(JSON.parse(json)),
  //   }),
  // ],
})

type InfinitelyNestedArray<T> = InfinitelyNestedArray<T>[] | T

export const spaceLayoutState = atom<InfinitelyNestedArray<string>>({
  key: `spaceLayout`,
  default: [],
  // effects: [localStorageEffect(`spaceLayout`)],
})

const findSpaceState = atomFamily<number, string>({
  key: `space`,
  default: 1,
  // effects: (id) => [localStorageEffect(id)],
})

export const addSpace: Write<() => string> = (transactors) => {
  const { set } = transactors
  const id = `space-${now()}`
  addToIndex(transactors, { indexAtom: spaceIndexState, id })
  set(findSpaceState(id), 1)
  return id
}

export const removeSpace: Write<(id: string) => void> = (transactors, id) =>
  removeFromIndex(transactors, { indexAtom: spaceIndexState, id })

export const viewsPerSpaceState = atom<Join>({
  key: `viewsPerSpace`,
  default: new Join({ relationType: `1:n` }),
  // effects: [
  //   localStorageSerializationEffect(`viewsPerSpace`, {
  //     serialize: (index) => JSON.stringify(index.toJSON()),
  //     deserialize: (json) => Join.fromJSON(JSON.parse(json)),
  //   }),
  // ],
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
  // effects: (id) => [
  //   localStorageSerializationEffect(id, {
  //     serialize: (view) => JSON.stringify(view),
  //     deserialize: (json) => JSON.parse(json),
  //   }),
  // ],
})

export const viewIndexState = atom<Set<string>>({
  key: `viewIndex`,
  default: new Set(),
  // effects: [
  //   localStorageSerializationEffect(`viewIndex`, {
  //     serialize: (set) => JSON.stringify([...set]),
  //     deserialize: (json) => new Set(JSON.parse(json)),
  //   }),
  // ],
})

export const allViewsState = selector<Entries<string, View>>({
  key: `allViews`,
  get: ({ get }) => {
    const viewIndex = get(viewIndexState)
    return [...viewIndex].map((id) => [id, get(findViewState(id))])
  },
})

type AddViewOptions = { spaceId?: string; path?: string }

const writeOperationAddView: Write<(options?: AddViewOptions) => void> = (
  transactors,
  { spaceId: maybeSpaceId, path } = {}
) => {
  const { get, set } = transactors
  const id = now()

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

export const writeOperationRemoveView: Write<(id: string) => void> = (
  transactors,
  id
) => {
  const { set } = transactors
  removeFromIndex(transactors, { indexAtom: viewIndexState, id })
  set(viewsPerSpaceState, (current) => current.remove(id))
}

export const addView = transaction<(options?: AddViewOptions) => void>({
  key: `add_view`,
  do: writeOperationAddView,
})

export const removeView = transaction({
  key: `remove_view`,
  do: writeOperationRemoveView,
})
