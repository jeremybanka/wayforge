import type { AsJSON, EnvironmentData, Fn, Transceiver } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createTransaction,
	IMPLICIT,
} from "atom.io/internal"

import type { disposeState } from "./dispose-state"
import type { findState } from "./find-state"
import type { getState } from "./get-state"
import type { editRelations, findRelations, getInternalRelations } from "./join"
import type { resetState } from "./reset-state"
import type { setState } from "./set-state"
import type {
	MutableAtomToken,
	TransactionToken,
	WritablePureSelectorToken,
} from "./tokens"

export type ReaderToolkit = Pick<ActorToolkit, `find` | `get` | `json`> & {
	relations: Pick<RelationsToolkit, `find` | `internal`>
}
export type WriterToolkit = Pick<
	ActorToolkit,
	`find` | `get` | `json` | `relations` | `set`
>
export type ActorToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	reset: typeof resetState
	find: typeof findState
	json: <T extends Transceiver<any, any, any>>(
		state: MutableAtomToken<T>,
	) => WritablePureSelectorToken<AsJSON<T>>
	dispose: typeof disposeState
	run: typeof runTransaction
	env: () => EnvironmentData
	relations: RelationsToolkit
}>

export type RelationsToolkit = {
	edit: typeof editRelations
	find: typeof findRelations
	internal: typeof getInternalRelations
}

export type Read<F extends Fn> = (
	toolkit: ReaderToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type Write<F extends Fn> = (
	toolkit: WriterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type Transact<F extends Fn> = (
	toolkit: ActorToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer F> ? F : never
export type TransactionOptions<F extends Fn> = {
	/** The unique identifier of the transaction */
	key: string
	/** The operation to perform */
	do: Transact<F>
}

/**
 * Create a transaction, a mechanism for batching updates multiple states in a single, all-or-nothing operation
 * @param options - {@link TransactionOptions}
 * @returns A reference to the transaction created: a {@link TransactionToken}
 */
export function transaction<F extends Fn>(
	options: TransactionOptions<F>,
): TransactionToken<F> {
	return createTransaction(IMPLICIT.STORE, options)
}

/**
 * Execute a {@link transaction}
 * @param token - A {@link TransactionToken}
 * @param id - A unique identifier for the transaction. If not provided, a random identifier will be generated
 * @returns A function that can be called to run the transaction with its {@link TransactionIO} parameters
 */
export function runTransaction<F extends Fn>(
	token: TransactionToken<F>,
	id: string = arbitrary(),
): (...parameters: Parameters<F>) => ReturnType<F> {
	return actUponStore(IMPLICIT.STORE, token, id)
}
