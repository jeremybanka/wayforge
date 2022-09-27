import { useEffect } from "react"

import type { Location } from "react-router-dom"
import { useLocation } from "react-router-dom"
import {
  atom,
  atomFamily,
  DefaultValue,
  selector,
  selectorFamily,
  useRecoilTransaction_UNSTABLE as useRecoilTransaction,
  useRecoilValue,
  useSetRecoilState,
} from "recoil"
import { string } from "zod"

import { Index1ToMany } from "~/lib/dynamic-relations/1ToMany"
import { lastOf } from "~/lib/fp-tools/array"
import type { Entries } from "~/lib/fp-tools/object"
import { now } from "~/lib/id/now"
import {
  localStorageEffect,
  localStorageSerializationEffect,
} from "~/lib/recoil-tools/effects/local-storage"
import { addToIndex, removeFromIndex } from "~/lib/recoil-tools/recoil-index"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"

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

export class ViewsPerSpace extends Index1ToMany<string, string> {
  public getViews(spaceId: string): Set<string> | undefined {
    return this.getViews(spaceId)
  }
  public getSpace(viewId: string): string | undefined {
    return this.getSpace(viewId)
  }
  // public override toJson(): [string, string[]][] {
  //   const assignments = new Index1To1().toJson.bind(this)()
  // }
  // private _focusedViews = {}
  // public getFocusedView(spaceId: string): string | undefined {
  // public set
}

export const viewsPerSpaceState = atom<ViewsPerSpace>({
  key: `viewsPerSpace`,
  default: new ViewsPerSpace(),
  effects: [
    localStorageSerializationEffect(`viewsPerSpace`, {
      serialize: (index) => JSON.stringify(index.toJson()),
      deserialize: (json) => new ViewsPerSpace(JSON.parse(json)),
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
export const useAddView = (): ((options?: AddViewOptions) => void) =>
  useRecoilTransaction(
    (transactors) => (options) =>
      options ? addView(transactors, options) : addView(transactors)
  )

const removeView: TransactionOperation<string> = (transactors, id) => {
  const { get, set } = transactors
  removeFromIndex(transactors, { indexAtom: viewIndexState, id })
  set(viewsPerSpaceState, (current) => {
    current.delete(undefined, id)
    return current
  })
}

export const useRemoveView = (): ((id: string) => void) =>
  useRecoilTransaction((transactors) => (id) => removeView(transactors, id))
