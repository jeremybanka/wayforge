import type { Location } from "react-router-dom"
import {
  atom,
  atomFamily,
  useRecoilTransaction_UNSTABLE as useRecoilTransaction,
} from "recoil"

import { Index1ToMany } from "~/lib/dynamic-relations/1ToMany"
import { lastOf } from "~/lib/fp-tools/array"
import { now } from "~/lib/id/now"
import {
  localStorageEffect,
  localStorageSerializationEffect,
} from "~/lib/recoil-tools/effects/local-storage"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"

export const spaceIndexState = atom<Set<string>>({
  key: `spaceIndex`,
  default: new Set(),
  effects: [
    localStorageSerializationEffect(`viewIndex`, {
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

export const addSpace: TransactionOperation<undefined, string> = ({ set }) => {
  const id = `space-${now()}`
  addToRecoilSet(set, spaceIndexState, id)
  set(findSpaceState(id), 1)
  return id
}

export const removeSpace: TransactionOperation<string> = ({ set }, id) => {
  removeFromRecoilSet(set, spaceIndexState, id)
}

export class ViewsPerSpace extends Index1ToMany<string, string> {
  public getViews(spaceId: string): Set<string> | undefined {
    return this.getChildren(spaceId)
  }
  public getSpace(viewId: string): string | undefined {
    return this.getParent(viewId)
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

const removeView: TransactionOperation<string> = ({ set }, id) => {
  removeFromRecoilSet(set, viewIndexState, id)
  set(viewsPerSpaceState, (current) => {
    current.delete(undefined, id)
    return current
  })
}

export const useRemoveView = (): ((id: string) => void) =>
  useRecoilTransaction((transactors) => (id) => removeView(transactors, id))

type AddViewOptions = { spaceId?: string; path?: string }

const addView: TransactionOperation<AddViewOptions | undefined> = (
  transactors,
  { spaceId: maybeSpaceId, path } = {}
) => {
  const { get, set } = transactors
  const id = `view-${now()}`
  addToRecoilSet(set, viewIndexState, id)
  set(findViewState(id), (current) => ({
    ...current,
    path: path ?? `/`,
    id,
  }))
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
