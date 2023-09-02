import {
	Store,
	createAtom,
	createAtomFamily,
	createReadonlySelectorFamily,
	createSelector,
	createSelectorFamily,
	redo__INTERNAL,
	timeline__INTERNAL,
	transaction__INTERNAL,
	undo__INTERNAL,
} from "atom.io/internal"

import type { redo, timeline, undo } from "."
import { getState, setState, subscribe } from "."
import type { atom, atomFamily } from "./atom"
import type { selector, selectorFamily } from "./selector"
import type { transaction } from "./transaction"

export class Silo {
	public store: Store
	public atom: typeof atom
	public atomFamily: typeof atomFamily
	public selector: typeof selector
	public selectorFamily: typeof selectorFamily
	public transaction: typeof transaction
	public timeline: typeof timeline
	public getState: typeof getState
	public setState: typeof setState
	public subscribe: typeof subscribe
	public undo: typeof undo
	public redo: typeof redo
	public constructor(name: string, fromStore: Store | null = null) {
		const store = new Store(name, fromStore)
		this.store = store
		this.atom = (options) => createAtom(options, undefined, store)
		this.atomFamily = (options) => createAtomFamily(options, store)
		this.selector = (options) => createSelector(options, undefined, store) as any
		this.selectorFamily = (options) =>
			createSelectorFamily(options, store) as any
		this.transaction = (options) => transaction__INTERNAL(options, store)
		this.timeline = (options) => timeline__INTERNAL(options, store)
		this.getState = (token) => getState(token, store)
		this.setState = (token, newValue) => setState(token, newValue, store)
		;(this.subscribe = (token, handler, key) =>
			subscribe(token, handler, key, store)),
			(this.undo = (token) => undo__INTERNAL(token, store))
		this.redo = (token) => redo__INTERNAL(token, store)
	}
}
