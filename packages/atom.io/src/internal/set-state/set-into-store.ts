import type { StateUpdate, WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import { initFamilyMemberInStore, seekInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"
import { isChildStore, isRootStore } from "../transaction"
import {
	deferDispatchUpdateForTransaction,
	emitStateCreation,
	emitStateUpdate,
} from "./dispatch"
import { resetAtomOrSelector } from "./reset-atom-or-selector"
import { RESET_STATE } from "./reset-in-store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	store: Store,
	token: WritableToken<T>,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<T, K extends Canonical, New extends T>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: K,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<T, New extends T>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, Canonical>,
				key: Canonical,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
		| [
				token: WritableToken<T>,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
): void {
	let isNew = false
	let token: WritableToken<T>
	let family: WritableFamilyToken<T, Canonical> | null = null
	let key: Canonical | null
	let value: New | typeof RESET_STATE | ((oldValue: T) => New)
	if (params.length === 2) {
		token = params[0]
		value = params[1]
		if (token.family) {
			// biome-ignore lint/style/noNonNullAssertion: this token belongs to a family
			family = getFamilyOfToken(store, token)!
			key = parseJson(token.family.subKey)
			const maybeToken = seekInStore(store, family, key)
			if (maybeToken) {
				token = maybeToken
			} else {
				token = initFamilyMemberInStore(store, family, key)
				isNew = true
			}
		}
	} else {
		family = params[0]
		key = params[1]
		value = params[2]
		const maybeToken = seekInStore(store, family, key)
		if (maybeToken) {
			token = maybeToken
		} else {
			token = initFamilyMemberInStore(store, family, key)
			isNew = true
		}
	}

	const action = value === RESET_STATE ? `reset` : `set`
	const rejectionTime = openOperation(store, token)
	if (rejectionTime) {
		const unsubscribe = store.on.operationClose.subscribe(
			`waiting to ${action} "${token.key}" at T-${rejectionTime}`,
			function waitUntilOperationCloseToSetState() {
				unsubscribe()
				store.logger.info(
					`🟢`,
					token.type,
					token.key,
					`resuming deferred`,
					action,
					`from T-${rejectionTime}`,
				)
				setIntoStore(store, token, value)
			},
		)
		return
	}

	if (`counterfeit` in token && `family` in token) {
		const subKey = token.family.subKey
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === subKey,
		)
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be`,
			action,
			`because it was not found in the store "${store.config.name}".`,
			disposal
				? `This state was previously disposed:\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		return
	}

	const state = withdraw(store, token)
	let update: StateUpdate<T>
	if (value === RESET_STATE) {
		update = resetAtomOrSelector(store, state)
	} else {
		update = setAtomOrSelector(store, state, value)
	}
	if (family && isNew) {
		const familyFn = withdraw(store, family)
		emitStateCreation(store, familyFn, state, update.newValue)
		return
	}
	if (state.type === `atom` || state.type === `mutable_atom`) {
		if (isRootStore(store)) {
			emitStateUpdate(store, state, update)
			return
		}
		if (isChildStore(store)) {
			deferDispatchUpdateForTransaction(store, state, update)
		}
	}
	closeOperation(store)
}
