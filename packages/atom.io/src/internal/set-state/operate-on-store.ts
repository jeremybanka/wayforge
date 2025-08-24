import type { WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import type { WritableFamily } from ".."
import { seekInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { mintInStore, MUST_CREATE } from "../families/mint-in-store"
import type { OpenOperation } from "../operation"
import { closeOperation, openOperation } from "../operation"
import { type Store, withdraw } from "../store"
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import { resetAtomOrSelector } from "./reset-atom-or-selector"
import { RESET_STATE } from "./reset-in-store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export const OWN_OP: unique symbol = Symbol(`OWN_OP`)
export const JOIN_OP: unique symbol = Symbol(`JOIN_OP`)

export function operateOnStore<T, New extends T>(
	store: Store,
	opMode: typeof JOIN_OP | typeof OWN_OP,
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
	let existingToken: WritableToken<T> | undefined
	let brandNewToken: WritableToken<T> | undefined
	let token: WritableToken<T>
	let family: WritableFamily<T, Canonical> | null
	let key: Canonical | null
	let value: New | typeof RESET_STATE | ((oldValue: T) => New)
	if (params.length === 2) {
		token = params[0]
		value = params[1]
		if (`family` in token) {
			family = getFamilyOfToken(store, token)
			key = parseJson(token.family.subKey)
			existingToken = seekInStore(store, family, key)
			if (!existingToken) {
				brandNewToken = mintInStore(store, family, key, MUST_CREATE)
				token = brandNewToken
			} else {
				token = existingToken
			}
		}
	} else {
		family = withdraw(store, params[0])
		key = params[1]
		value = params[2]
		existingToken = seekInStore(store, family, key)
		if (!existingToken) {
			brandNewToken = mintInStore(store, family, key, MUST_CREATE)
			token = brandNewToken
		} else {
			token = existingToken
		}
	}

	const action = value === RESET_STATE ? `reset` : `set`

	let target: Store & { operation: OpenOperation }

	if (opMode === OWN_OP) {
		const result = openOperation(store, token)
		const rejected = typeof result === `number`
		if (rejected) {
			const rejectionTime = result
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
					operateOnStore(store, opMode, token, value)
				},
			)
			return
		}
		target = result
	} else {
		target = store as Store & { operation: OpenOperation }
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
			`because key`,
			subKey,
			`is not allocated.`,
			disposal
				? `this key was previously disposed:${disposal.trace}`
				: `(no previous disposal trace found)`,
		)
		return
	}

	const state = withdraw(target, token)
	let protoUpdate: [T, T]
	if (value === RESET_STATE) {
		protoUpdate = resetAtomOrSelector(target, state)
	} else {
		protoUpdate = setAtomOrSelector(target, state, value)
	}
	const isNewlyCreated = Boolean(brandNewToken)
	dispatchOrDeferStateUpdate(target, state, protoUpdate, isNewlyCreated)

	if (opMode === OWN_OP) {
		closeOperation(target)
	}
}
