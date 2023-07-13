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

import { lastOf } from "~/packages/anvl/src/array"
import { now } from "~/packages/anvl/src/id/now"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object/entries"
import {
	localStorageEffect,
	localStorageSerializationEffect,
} from "~/packages/hamr/src/recoil-effect-storage/local-storage"
import {
	addToIndex,
	removeFromIndex,
} from "~/packages/hamr/src/recoil-tools/recoil-index"
import type { Transact } from "~/packages/hamr/src/recoil-tools/recoil-transaction-tools"

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

export const addSpace: Transact<() => string> = (transactors) => {
	const { set } = transactors
	const id = `space-${now()}`
	addToIndex(transactors, { indexAtom: spaceIndexState, id })
	set(findSpaceState(id), 1)
	return id
}

export const removeSpace: Transact<(id: string) => void> = (transactors, id) =>
	removeFromIndex(transactors, { indexAtom: spaceIndexState, id })

export const viewsPerSpaceState = atom<Join<null, `viewId`, `spaceId`>>({
	key: `viewsPerSpace`,
	default: new Join({ relationType: `1:n` }).from(`viewId`).to(`spaceId`),
	effects: [
		localStorageSerializationEffect(`viewsPerSpace`, {
			serialize: (index) => JSON.stringify(index.toJSON()),
			deserialize: (json) =>
				Join.fromJSON<null, `viewId`, `spaceId`>(JSON.parse(json), {
					from: `viewId`,
					to: `spaceId`,
				}),
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
		([, view]) => view.location.key === location.key,
	)
	const viewId = locationView?.[0] ?? ``
	const setView = useSetRecoilState(findViewState(viewId))
	useEffect(() => {
		setView((v) => ({ ...v, title }))
	}, [title, setView])
}

type AddViewOptions = { spaceId?: string; path?: string }

const OP_addView: Transact<(options?: AddViewOptions) => void> = (
	transactors,
	{ spaceId: maybeSpaceId, path } = {},
) => {
	const { get, set } = transactors
	const viewId = `view-${now()}`
	addToIndex(transactors, { indexAtom: viewIndexState, id: viewId })
	set(
		findViewState(viewId),
		(current): View => ({
			...current,
			location: {
				...current.location,
				pathname: path ?? `/`,
				state: { id: viewId },
			},
		}),
	)
	const spaceId =
		maybeSpaceId ?? lastOf([...get(spaceIndexState)]) ?? addSpace(transactors)
	set(viewsPerSpaceState, (current) => {
		current.set({ spaceId, viewId })
		return current
	})
}

export const useOperation = <Options>(
	operation: Transact<(options: Options) => void>,
): ((param: Options) => void) =>
	useRecoilTransaction(
		(transactors) => (options) => operation(transactors, options),
	)

export const useAddView = (): ((options?: AddViewOptions) => void) =>
	useRecoilTransaction(
		(transactors) => (options) => OP_addView(transactors, options),
	)

const removeView: Transact<(viewId: string) => void> = (transactors, viewId) => {
	const { set } = transactors
	removeFromIndex(transactors, { indexAtom: viewIndexState, id: viewId })
	set(viewsPerSpaceState, (current) => current.remove({ viewId }))
}

export const useRemoveView = (): ((id: string) => void) =>
	useRecoilTransaction((transactors) => (id) => removeView(transactors, id))
