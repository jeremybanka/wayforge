import { waitFor } from "@testing-library/react"
import type { Compound, TransactionUpdate } from "atom.io"
import * as AtomIO from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
import {
	editRelations,
	editRelationsInStore,
	findRelationsInStore,
	getInternalRelations,
	getInternalRelationsFromStore,
	join,
} from "atom.io/data"
import type { Signal } from "atom.io/internal"
import { getUpdateToken, IMPLICIT } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"
import * as AR from "atom.io/react"
import type {
	Actual,
	TransactionRequestActual,
	VisibilityCondition,
} from "atom.io/realtime"
import * as RT from "atom.io/realtime"
import {
	continuity,
	derefTransactionRequest,
	perspectiveAliases,
	view,
} from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import type { UserKey } from "atom.io/realtime-server"
import * as RTS from "atom.io/realtime-server"
import { aliasTransactionUpdate } from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { useContext } from "react"

import { mark } from "../../__util__"
import { throwUntil } from "../../__util__/waiting"

describe(`realtime occlusion`, () => {
	editRelations(perspectiveAliases, (relations) => {
		relations.set({
			perspective: `T$--perspective==__hi__++user::bob`,
			alias: `$$yo$$`,
		})
	})

	it(`dereferences transaction requests with aliases`, () => {
		mark(`start`)
		const update = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::$$yo$$`],
		} satisfies TransactionRequestActual

		console.log(`aliased update`, update)

		const updateStringified = stringifyJson(update)

		mark(`update stringified`)

		const actualUpdate = derefTransactionRequest(`user::bob`, updateStringified)
		mark(`update dereferenced`)
		if (actualUpdate instanceof Error) {
			console.log(actualUpdate)
		} else {
			console.log(`actual update`, parseJson(actualUpdate))
		}
		mark(`update parsed`)
	})
	it(`encodes aliases into completed transaction updates`, () => {
		mark(`start encoding`)
		type ItemKey = `item::${string}`
		type ItemVisibilityKey = Compound<`view`, `${ItemKey}::${Actual}`, UserKey>
		const itemWeightAtoms = atomFamily<number, ItemKey>({
			key: `weight`,
			default: 0,
		})
		const itemWeightMasks = selectorFamily<number | `???`, ItemKey>({
			key: `weightMask`,
			get: (_) => (__) => {
				return `???`
			},
			set: (_) => (__) => {},
		})

		const itemVisibilitySelectors = selectorFamily<
			VisibilityCondition,
			ItemVisibilityKey
		>({
			key: `itemVisibility`,
			get: (_) => (__) => {
				return `masked`
			},
		})

		const {
			globalIndex: itemGlobalIndex,
			perspectiveIndices: itemPerspectiveIndices,
		} = view({
			key: `item`,
			selectors: itemVisibilitySelectors,
		})

		mark(`states created`)

		const itemContinuity = continuity({
			key: `item`,
			config: (group) =>
				group.add(itemPerspectiveIndices, [itemWeightAtoms, itemWeightMasks]),
		})

		mark(`continuity created`)

		const actualUpdate = {
			id: `123`,
			key: `myTransaction`,
			params: [`item::__hi__`],
			updates: [
				{
					type: `atom_update`,
					key: `weight("item::__hi__")`,
					newValue: 10,
					oldValue: 0,
					family: {
						key: `item`,
						subKey: `__hi__`,
					},
				},
				{
					type: `atom_update`,
					key: `*relatedKeys/characterItems("character:)`,
					newValue: `add:"__item::__"`,
					oldValue: 0,
					family: {
						key: `item`,
						subKey: `__hi__`,
					},
				},
			],
			type: `transaction_update`,
			epoch: 0,
			output: {},
		} satisfies TransactionUpdate<any>

		console.log(`actual update`, actualUpdate)

		mark(`update created`)

		const aliasedUpdate = aliasTransactionUpdate(
			IMPLICIT.STORE,
			itemContinuity,
			`user::bob`,
			actualUpdate,
		)

		mark(`update encoded`)

		console.log(`aliased update`, aliasedUpdate)
	})
})

describe.only(`join in perspective`, () => {
	const scenario = () => {
		// HIERARCHY
		type GameKey = `game::${string}`
		const isGameKey = (key: string): key is GameKey => key.startsWith(`game::`)
		type PlayerKey = `T$--player==${GameKey}++${UserKey}`
		const isPlayerKey = (key: string): key is PlayerKey =>
			key.startsWith(`T$--player==game::`)
		type CharacterKey<K extends RT.Actual | RT.Alias = RT.Actual | RT.Alias> =
			`character::${K}`
		const isCharKey = (key: string): key is CharacterKey =>
			key.startsWith(`character::`)
		type ItemKey = `item::${string}`
		const isItemKey = (key: string): key is ItemKey => key.startsWith(`item::`)

		type GameHierarchy = AtomIO.Hierarchy<
			[
				{
					above: `root`
					below: [GameKey, UserKey]
				},
				{
					above: [GameKey, UserKey]
					style: `all`
					below: PlayerKey
				},
				{
					above: GameKey
					below: [ItemKey, CharacterKey]
				},
				{
					above: PlayerKey
					below: [ItemKey, CharacterKey]
				},
			]
		>

		// STATES
		type CharViewKey = AtomIO.Compound<`view`, CharacterKey<RT.Actual>, UserKey>
		const {
			globalIndex: characterGlobalIndex,
			perspectiveIndices: characterPerspectiveIndices,
		} = RT.view({
			key: `character`,
			selectors: AtomIO.selectorFamily<RT.VisibilityCondition, CharViewKey>({
				key: `characterVisibility`,
				get: (_) => (__) => {
					return `masked`
				},
			}),
		})
		const worldTimeAtom = AtomIO.atom<number>({ key: `worldTime`, default: 0 })

		const players = join({
			key: `players`,
			between: [`game`, `user`],
			cardinality: `1:n`,
			isAType: isGameKey,
			isBType: RTS.isUserKey,
		})

		const playerCharacters = join({
			key: `playersOfCharacters`,
			between: [`player`, `character`],
			cardinality: `1:n`,
			isAType: isPlayerKey,
			isBType: isCharKey,
		})
		const playerCharactersJsonMasks = AtomIO.selectorFamily<
			SetRTXJson<CharacterKey | PlayerKey>,
			CharacterKey<RT.Alias> | PlayerKey
		>({
			key: `playerCharacterJsonMask`,
			get:
				(characterRelationKey) =>
				({ env, find, get, json }) => {
					const { store } = env()
					const alias = characterRelationKey.split(`::`).pop() as RT.Alias
					console.log(`\t`, `alias`, alias)
					const perspectiveKey = get(
						findRelationsInStore(perspectiveAliases, alias, store)
							.perspectiveKeyOfAlias,
					)
					console.log(
						`------------------------------------------------------------\n\n`,
					)
					console.log(`\t`, `characterRelationKey`, characterRelationKey)
					console.log(`\t`, `alias`, alias)
					console.log(`\t`, `perspectiveKey`, perspectiveKey)
					console.log(
						`\n\n------------------------------------------------------------`,
					)

					if (perspectiveKey) {
						const [, actualKey] = AtomIO.decomposeCompoundKey(perspectiveKey)
						const actualCharacterKey = `character::${actualKey}` as const
						const jsonMask = get(
							json(
								find(
									getInternalRelationsFromStore(playerCharacters, store),
									actualCharacterKey,
								),
							),
						)
						return jsonMask
					}
					return new SetRTX<CharacterKey | PlayerKey>().toJSON()
				},
			set: (_) => (__) => {},
		})
		const playerCharactersUpdateMasks = AtomIO.selectorFamily<
			Signal<SetRTX<CharacterKey | PlayerKey>>,
			CharacterKey | PlayerKey
		>({
			key: `playerCharacterUpdateMask`,
			get:
				(characterRelationKey) =>
				({ find, get }) => {
					return get(
						getUpdateToken(
							find(getInternalRelations(playerCharacters), characterRelationKey),
						),
					)
				},
			set: (_) => (__) => {},
		})

		const characterPositionAtoms = AtomIO.atomFamily<
			{ x: number; y: number },
			CharacterKey
		>({
			key: `position`,
			default: { x: 0, y: 0 },
		})
		const characterPositionMasks = AtomIO.selectorFamily<
			{ x: number; y: number } | null,
			CharacterKey
		>({
			key: `positionMask`,
			get: (_) => (__) => {
				return { x: 0, y: 0 }
			},
			set: (_) => (__) => {},
		})
		const healthAtoms = AtomIO.atomFamily<number, CharacterKey>({
			key: `health`,
			default: 0,
		})
		const healthMasks = AtomIO.selectorFamily<number | null, CharacterKey>({
			key: `healthMask`,
			get: (_) => (__) => {
				return 0
			},
			set: (_) => (__) => {},
		})
		function mask<T, K extends Canonical>(
			actual: AtomIO.AtomFamilyToken<T, K>,
			_: AtomIO.WritableSelectorFamilyToken<T, K>,
		): AtomIO.WritableFamilyToken<T, K> {
			return actual
		}

		const attackTX = AtomIO.transaction<(defender: CharacterKey) => void>({
			key: `increment`,
			do: ({ set }, defenderKey) => {
				set(mask(healthAtoms, healthMasks), defenderKey, (health) =>
					health === null ? null : health - 10,
				)
			},
		})

		const gameContinuity = RT.continuity({
			key: `game`,
			config: (group) =>
				group
					.add(worldTimeAtom)
					.add(
						characterPerspectiveIndices,
						[healthAtoms, healthMasks],
						[
							getInternalRelations(playerCharacters),
							playerCharactersJsonMasks,
							playerCharactersUpdateMasks,
						],
					)
					.add(attackTX),
		})

		return RTTest.multiClient({
			port: 5485,
			server: ({ socket, silo, enableLogging }) => {
				const { store } = silo
				// enableLogging()
				silo.setState(characterGlobalIndex, (prev) =>
					prev.add(`character::__janette__`),
				)
				editRelationsInStore(
					playerCharacters,
					(relations) => {
						relations.set({
							player: `T$--player==game::battle++user::jane`,
							character: `character::__janette__`,
						})
					},
					store,
				)
				const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
					socket,
					store,
				})
				exposeContinuity(gameContinuity)
			},
			clients: {
				jane: () => {
					RTR.useSyncContinuity(gameContinuity)
					const store = useContext(AR.StoreContext)
					const myUsername = AR.useO(myUsernameState)
					const myCharacter = AR.useO(
						findRelationsInStore(
							playerCharacters,
							`T$--player==game::battle++user::${myUsername}`,
							store,
						).characterKeysOfPlayer,
					)
					console.log({ myUsername, myCharacter })

					return (
						<span data-testid={`state`}>
							<span data-testid={`character`}>{myCharacter[0]}</span>
							<span data-testid={`username`}>{myUsername}</span>
						</span>
					)
				},
			},
		})
	}

	test(`occlusion`, async () => {
		const { clients, server, teardown } = scenario()
		const jane = clients.jane.init()

		jane.enableLogging()

		await waitFor(() => {
			throwUntil(jane.socket.connected)
		})

		await waitFor(() => {
			expect(jane.renderResult.getByTestId(`character`).textContent).toBe(
				`character::__janette__`,
			)
		})
	})
})
