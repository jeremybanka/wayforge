import type { WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import { findInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { resetAtomOrSelector } from "./reset-atom-or-selector"
import { RESET_STATE } from "./reset-in-store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	target: Store,
	token: WritableToken<T>,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<T, K extends Canonical, New extends T>(
	target: Store,
	token: WritableFamilyToken<T, K>,
	key: K,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<T, New extends T>(
	target: Store,
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
	let token: WritableToken<T>
	let family: WritableFamilyToken<T, Canonical> | null
	let key: Canonical | null
	let value: New | typeof RESET_STATE | ((oldValue: T) => New)
	if (params.length === 2) {
		token = params[0]
		value = params[1]
		if (token.family) {
			// biome-ignore lint/style/noNonNullAssertion: this token belongs to a family
			family = getFamilyOfToken(target, token)!
			key = parseJson(token.family.subKey)
			token = findInStore(target, family, key)
		}
	} else {
		family = params[0]
		key = params[1]
		value = params[2]
		token = findInStore(target, family, key)
	}

	const action = value === RESET_STATE ? `reset` : `set`

	if (`counterfeit` in token && `family` in token) {
		const subKey = token.family.subKey
		const disposal = target.disposalTraces.buffer.find(
			(item) => item?.key === subKey,
		)
		target.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be`,
			action,
			`because it was not found in the store "${target.config.name}".`,
			disposal
				? `This state was previously disposed:\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		return
	}

	const rejectionTime = openOperation(target, token)
	if (rejectionTime) {
		const unsubscribe = target.on.operationClose.subscribe(
			`waiting to ${action} "${token.key}" at T-${rejectionTime}`,
			function waitUntilOperationCloseToSetState() {
				unsubscribe()
				target.logger.info(
					`🟢`,
					token.type,
					token.key,
					`resuming deferred`,
					action,
					`from T-${rejectionTime}`,
				)
				setIntoStore(target, token, value)
			},
		)
		return
	}
	if (value === RESET_STATE) {
		resetAtomOrSelector(target, token)
	} else {
		setAtomOrSelector(target, token, value)
	}
	closeOperation(target)
}
