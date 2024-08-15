import type { findState } from "atom.io/ephemeral"
import {
	createAtomFamily,
	createMoleculeFamily,
	createSelectorFamily,
	createStandaloneAtom,
	createStandaloneSelector,
	createTimeline,
	createTransaction,
	disposeFromStore,
	findInStore,
	getFromStore,
	makeMoleculeInStore,
	setIntoStore,
	Store,
	timeTravel,
} from "atom.io/internal"

import type {
	disposeState,
	getState,
	makeMolecule,
	moleculeFamily,
	redo,
	setState,
	subscribe,
	timeline,
	undo,
} from "."
import { subscribeInStore } from "."
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
	public findState: typeof findState
	public getState: typeof getState
	public setState: typeof setState
	public disposeState: typeof disposeState
	public subscribe: typeof subscribe
	public undo: typeof undo
	public redo: typeof redo
	public moleculeFamily: typeof moleculeFamily
	public makeMolecule: typeof makeMolecule
	public constructor(config: Store[`config`], fromStore: Store | null = null) {
		const s = new Store(config, fromStore)
		this.store = s
		this.atom = ((options: Parameters<typeof atom>[0]) =>
			createStandaloneAtom(s, options)) as typeof atom
		this.atomFamily = ((options: Parameters<typeof atomFamily>[0]) =>
			createAtomFamily(s, options)) as typeof atomFamily
		this.selector = ((options: Parameters<typeof selector>[0]) =>
			createStandaloneSelector(s, options)) as typeof selector
		this.selectorFamily = ((options: Parameters<typeof selectorFamily>[0]) =>
			createSelectorFamily(s, options)) as typeof selectorFamily
		this.transaction = (options) => createTransaction(options, s)
		this.timeline = (options) => createTimeline(options, s)
		this.findState = ((...params: Parameters<typeof findState>) =>
			findInStore(s, ...params)) as typeof findState
		this.getState = ((...params: Parameters<typeof getState>) =>
			getFromStore(s, ...params)) as typeof getState
		this.setState = ((...params: Parameters<typeof setState>) => {
			setIntoStore(s, ...params)
		}) as typeof setState
		this.disposeState = ((...params: Parameters<typeof disposeState>) => {
			disposeFromStore(s, ...params)
		}) as typeof disposeState
		this.subscribe = ((...params: Parameters<typeof subscribe>) =>
			subscribeInStore(s, ...params)) as typeof subscribe
		this.undo = (token) => {
			timeTravel(s, `undo`, token)
		}
		this.redo = (token) => {
			timeTravel(s, `redo`, token)
		}
		this.moleculeFamily = ((options: Parameters<typeof moleculeFamily>[0]) => {
			return createMoleculeFamily(s, options)
		}) as typeof moleculeFamily
		this.makeMolecule = ((...params: Parameters<typeof makeMolecule>) => {
			return makeMoleculeInStore(s, ...params)
		}) as typeof makeMolecule
	}
}
