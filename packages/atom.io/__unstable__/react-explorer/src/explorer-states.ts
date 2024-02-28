import type {
	ReadonlySelectorFamilyToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableSelectorFamilyToken,
	Write,
} from "atom.io"
import { atom, selector, selectorFamily, transaction } from "atom.io"
import { persistAtom } from "~/packages/atom.io/__unstable__/web-effects/src"

import { lastOf } from "~/packages/anvl/src/array"
import { now } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Entries } from "~/packages/anvl/src/object"

import { addToIndex, removeFromIndex } from "."
import {
	makeSpaceFamily,
	makeSpaceIndex,
	makeSpaceLayoutNodeFamily,
	makeSpaceLayoutState,
} from "./space-states"
import type { View } from "./view-states"
import {
	makeViewFamily,
	makeViewFocusedFamily,
	makeViewIndex,
} from "./view-states"

export const makeViewsPerSpaceState = (
	key: string,
): RegularAtomToken<Join<null, `viewId`, `spaceId`>> =>
	atom<Join<null, `viewId`, `spaceId`>>({
		key: `${key}:views_per_space`,
		default: new Join({ relationType: `1:n` }).from(`viewId`).to(`spaceId`),
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
	viewsPerSpaceState: RegularAtomToken<Join<null, `viewId`, `spaceId`>>,
): ReadonlySelectorFamilyToken<string[], string> =>
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
	findSpaceViewsState: ReadonlySelectorFamilyToken<string[], string>,
	findViewFocusedState: RegularAtomFamilyToken<number, string>,
): WritableSelectorFamilyToken<string | null, string> =>
	selectorFamily<string | null, string>({
		key: `${key}:space_focused_view`,
		get:
			(spaceKey) =>
			({ find, get }) => {
				const spaceViewsState = find(findSpaceViewsState, spaceKey)
				const views = get(spaceViewsState)
				const viewsLastFocused = views.map((viewKey): [string, number] => {
					const viewsLastFocusedState = find(findViewFocusedState, viewKey)
					return [viewKey, get(viewsLastFocusedState)]
				})
				const lastFocused = lastOf(viewsLastFocused.sort((a, b) => b[1] - a[1]))
				return lastFocused ? lastFocused[0] : null
			},
		set:
			(spaceKey) =>
			({ find, get, set }, viewKey) => {
				if (viewKey === null) {
					return
				}
				const spaceViewsState = find(findSpaceViewsState, spaceKey)
				const views = get(spaceViewsState)
				if (views.includes(viewKey)) {
					const viewFocusedState = find(findViewFocusedState, viewKey)
					set(viewFocusedState, Date.now())
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
		findViewFocusedState,
	)

	const allViewsState = selector<Entries<string, View>>({
		key: `${key}:all_views`,
		get: ({ find, get }) => {
			const viewIndex = get(viewIndexState)
			return [...viewIndex].map((id) => [id, get(find(findViewState, id))])
		},
	})

	const writeOperationAddSpace: Write<(options?: SplitSpaceOptions) => string> =
		(transactors, { parentId = `root` } = {}) => {
			const { find, set } = transactors
			const key = `s-${now()}`
			addToIndex(transactors, { indexAtom: spaceIndexState, id: key })
			set(spaceLayoutState, (current) =>
				current.set({ parent: `parent:${parentId}`, child: key }, { size: 1 }),
			)
			const spaceState = find(findSpaceState, key)
			set(spaceState, 1)
			return key
		}

	const writeOperationRemoveSpace: Write<(id: string) => void> = (
		transactors,
		id,
	) => {
		removeFromIndex(transactors, { indexAtom: spaceIndexState, id })
	}

	const writeOperationAddView: Write<(options?: AddViewOptions) => void> = (
		transactors,
		{ spaceId: maybeSpaceId, path } = {},
	) => {
		const { find, get, set } = transactors
		const id = `v-${now()}`

		addToIndex(transactors, { indexAtom: viewIndexState, id })
		const viewState = find(findViewState, id)
		set(
			viewState,
			(current): View => ({
				...current,
				location: {
					...current.location,
					pathname: path ?? `/`,
				},
			}),
		)
		const spaceId =
			maybeSpaceId ??
			lastOf([...get(spaceIndexState)]) ??
			writeOperationAddSpace(transactors)
		const viewFocusedState = find(findViewFocusedState, id)
		set(viewFocusedState, Date.now())
		set(viewsPerSpaceState, (current) => current.set({ spaceId, viewId: id }))
		set(viewFocusedState, Date.now())
	}

	const writeOperationRemoveView: Write<(viewId: string) => void> = (
		transactors,
		viewId,
	) => {
		const { set } = transactors
		removeFromIndex(transactors, { indexAtom: viewIndexState, id: viewId })
		set(viewsPerSpaceState, (current) => current.remove({ viewId }))
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
