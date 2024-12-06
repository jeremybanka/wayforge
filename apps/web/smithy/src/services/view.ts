import { useEffect } from "react"
import type { Location } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { atom, atomFamily, selector, transaction } from "atom.io"
import { persistSync } from "atom.io/web"
import { useI, useO } from "atom.io/react"

import { lastOf } from "~/packages/anvl/src/array"
import { now } from "~/packages/anvl/src/id/now"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object/entries"

export const spaceIndexState = atom<Set<string>>({
	key: `spaceIndex`,
	default: new Set(),
	effects: [
		persistSync(
			localStorage,
			{
				stringify: (set) => JSON.stringify([...set]),
				parse: (json) => new Set(JSON.parse(json)),
			},
			`spaceIndex`,
		),
	],
})

type InfinitelyNestedArray<T> = InfinitelyNestedArray<T>[] | T

export const spaceLayoutState = atom<InfinitelyNestedArray<string>>({
	key: `spaceLayout`,
	default: [],
	effects: [persistSync(localStorage, JSON, `spaceLayout`)],
})

const spaceAtoms = atomFamily<number, string>({
	key: `space`,
	default: 1,
	effects: (id) => [persistSync(localStorage, JSON, id)],
})

export const addSpaceTX = transaction<() => string>({
	key: `addSpace`,
	do: (transactors) => {
		const { set } = transactors
		const id = `space-${now()}`
		set(spaceIndexState, (current) => new Set([...current, id]))
		set(spaceAtoms, id, 1)
		return id
	},
})

export const removeSpaceTX = transaction<(id: string) => void>({
	key: `removeSpace`,
	do: (transactors, id) => {
		const { set } = transactors
		set(spaceIndexState, (current) => {
			const next = new Set<string>(current)
			next.delete(id)
			return next
		})
		set(spaceAtoms, id, 1)
	},
})

export const viewsPerSpaceState = atom<Join<null, `viewId`, `spaceId`>>({
	key: `viewsPerSpace`,
	default: new Join({ relationType: `1:n` }).from(`viewId`).to(`spaceId`),
	effects: [
		persistSync(
			localStorage,
			{
				stringify: (index) => JSON.stringify(index.toJSON()),
				parse: (json) =>
					Join.fromJSON<null, `viewId`, `spaceId`>(JSON.parse(json), {
						from: `viewId`,
						to: `spaceId`,
					}),
			},
			`viewsPerSpace`,
		),
	],
})

export type View = {
	title: string
	location: Location
}

export const viewAtoms = atomFamily<View, string>({
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
		persistSync(
			localStorage,
			{
				stringify: (view) => JSON.stringify(view),
				parse: (json) => JSON.parse(json),
			},
			id,
		),
	],
})

export const viewIndexState = atom<Set<string>>({
	key: `viewIndex`,
	default: new Set(),
	effects: [
		persistSync(
			localStorage,
			{
				stringify: (set) => JSON.stringify([...set]),
				parse: (json) => new Set(JSON.parse(json)),
			},
			`viewIndex`,
		),
	],
})

export const allViewsState = selector<Entries<string, View>>({
	key: `allViews`,
	get: ({ get }) => {
		const viewIndex = get(viewIndexState)
		return [...viewIndex].map((id) => [id, get(viewAtoms, id)])
	},
})

export const useSetTitle = (title: string): void => {
	const location = useLocation()
	const views = useO(allViewsState)
	const locationView = views.find(
		([, view]) => view.location.key === location.key,
	)
	const viewId = locationView?.[0] ?? ``
	const setView = useI(viewAtoms, viewId)
	useEffect(() => {
		setView((v) => ({ ...v, title }))
	}, [title, setView])
}

type AddViewOptions = { spaceId?: string; path?: string }

export const addViewTX = transaction<(options?: AddViewOptions) => void>({
	key: `addView`,
	do: (transactors, { spaceId: maybeSpaceId, path } = {}) => {
		const { get, set, run } = transactors
		const viewId = `view-${now()}`
		set(viewIndexState, (current) => new Set([...current, viewId]))
		set(
			viewAtoms,
			viewId,
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
			maybeSpaceId ?? lastOf([...get(spaceIndexState)]) ?? run(addSpaceTX)()
		set(viewsPerSpaceState, (current) => {
			current.set({ spaceId, viewId })
			return current
		})
	},
})
