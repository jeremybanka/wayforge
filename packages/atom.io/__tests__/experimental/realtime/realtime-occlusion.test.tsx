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
import {
	findInStore,
	getFromStore,
	getUpdateToken,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"
import * as AR from "atom.io/react"
import type {
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
import { myUserKeyActualState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import type { UserKey } from "atom.io/realtime-server"
import * as RTS from "atom.io/realtime-server"
import { aliasTransactionUpdate } from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTX, SetRTXJson } from "atom.io/transceivers/set-rtx"
import type { FC } from "react"
import { useContext } from "react"

import { mark } from "../../__util__"
import { throwUntil } from "../../__util__/waiting"

describe(`realtime occlusion`, () => {
	editRelations(perspectiveAliases, (relations) => {
		relations.set({
			perspective: `T$--perspective==__hi__++user::__bob__`,
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

		const actualUpdate = derefTransactionRequest(
			IMPLICIT.STORE,
			`user::__bob__`,
			updateStringified,
		)
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
		type ItemKey<K extends RT.Actual | RT.Alias = RT.Actual | RT.Alias> =
			`item::${K}`
		type ItemVisibilityKey = Compound<
			AtomIO.Tag<`view`>,
			ItemKey<RT.Actual>,
			UserKey<RT.Actual>
		>
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
			`user::__bob__`,
			actualUpdate,
		)

		mark(`update encoded`)

		console.log(`aliased update`, aliasedUpdate)
	})
})

describe(`join in perspective`, () => {
	const scenario = () => {
		// HIERARCHY
		type GameKey = `game::${string}`
		const isGameKey = (key: string): key is GameKey => key.startsWith(`game::`)
		type PlayerKey<K extends RT.Actual | RT.Alias = RT.Actual | RT.Alias> =
			`T$--player==${GameKey}++${UserKey<K>}`
		const isPlayerKey = (key: string): key is PlayerKey =>
			key.startsWith(`T$--player==game::`)
		type CharacterKey<K extends RT.Actual | RT.Alias = RT.Actual | RT.Alias> =
			`character::${K}`
		const isCharacterKey = (key: string): key is CharacterKey =>
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
		type CharViewKey = AtomIO.Compound<
			AtomIO.Tag<`view`>,
			CharacterKey<RT.Actual>,
			UserKey<RT.Actual>
		>
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
		type PlayerViewKey = AtomIO.Compound<
			AtomIO.Tag<`view`>,
			PlayerKey<RT.Actual>,
			UserKey<RT.Actual>
		>
		const {
			globalIndex: playerGlobalIndex,
			perspectiveIndices: playerPerspectiveIndices,
		} = RT.view({
			key: `player`,
			selectors: AtomIO.selectorFamily<RT.VisibilityCondition, PlayerViewKey>({
				key: `playerVisibility`,
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

		const playersOfGames = join(
			{
				key: `playersOfGames`,
				between: [`game`, `user`],
				cardinality: `n:n`,
				isAType: isGameKey,
				isBType: RTS.isUserKey,
			},
			{ defaultContent: `X` as PlayerKey },
		)

		const userAliasSelectors = AtomIO.selectorFamily<
			UserKey<RT.Alias> | null,
			UserKey<RT.Actual>
		>({
			key: `playerSelectors`,
			get:
				(userKey) =>
				({ env, get }) => {
					const { store } = env()
					const actual = RT.extractActualKeys(userKey)[0][0]
					const perspectiveKey: RT.PerspectiveKey = `T$--perspective==${actual}++${userKey}`
					const userAlias = get(
						findRelationsInStore(perspectiveAliases, perspectiveKey, store)
							.aliasKeyOfPerspective,
					)
					if (userAlias) {
						return `user::${userAlias}`
					}
					return null
				},
			set: (_) => (__) => {},
		})

		const playerCharacters = join({
			key: `playersOfCharacters`,
			between: [`player`, `character`],
			cardinality: `1:n`,
			isAType: isPlayerKey,
			isBType: isCharacterKey,
		})
		const playerCharactersJsonMasks = AtomIO.selectorFamily<
			SetRTXJson<CharacterKey<RT.Alias> | PlayerKey<RT.Alias>>,
			CharacterKey<RT.Alias> | PlayerKey<RT.Alias>
		>({
			key: `playerCharacterJsonMask`,
			get:
				(playerCharacterRelationKey) =>
				({ env, find, get, json }) => {
					let owner: UserKey<RT.Actual> | undefined

					const { store } = env()
					const [relationAliases, compileActualKey] = RT.extractAliasKeys(
						playerCharacterRelationKey,
					)
					console.log(`\t`, `aliases`, relationAliases)
					const relationActuals: RT.Actual[] = []
					for (const alias of relationAliases) {
						const perspectiveKey = get(
							findRelationsInStore(perspectiveAliases, alias, store)
								.perspectiveKeyOfAlias,
						)

						if (perspectiveKey) {
							const [, actual, userKey] =
								AtomIO.decomposeCompoundKey(perspectiveKey)
							owner ??= userKey
							relationActuals.push(actual)
						}
					}
					const actualKey = compileActualKey(relationActuals)
					const jsonMask = get(
						json(
							find(
								getInternalRelationsFromStore(playerCharacters, store),
								actualKey,
							),
						),
					)

					const aliasedMembers: (
						| CharacterKey<RT.Alias>
						| PlayerKey<RT.Alias>
					)[] = []
					for (const memberKey of jsonMask.members) {
						if (RT.holdsAliases(memberKey) && owner) {
							const [memberActuals, compileAliasedKeys] =
								RT.extractActualKeys(memberKey)
							const memberAliases: RT.Alias[] = []
							for (const actual of memberActuals) {
								const perspectiveKey =
									`T$--perspective==${actual}++${owner}` as const
								const alias = getFromStore(
									store,
									findRelationsInStore(perspectiveAliases, perspectiveKey, store)
										.aliasKeyOfPerspective,
								)
								if (alias) {
									memberAliases.push(alias)
								}
							}
							const aliasedMember = compileAliasedKeys(memberAliases)
							aliasedMembers.push(aliasedMember)
						}
					}

					console.log(
						`------------------------------------------------------------\n\n`,
					)
					console.log(`\t`, `characterRelationKey`, playerCharacterRelationKey)
					console.log(`\t`, `relationAliases`, relationAliases)
					console.log(`\t`, `relationActuals`, relationActuals)
					console.log(`\t`, `actualKey`, actualKey)
					console.log(
						`\n\n------------------------------------------------------------`,
					)
					return { ...jsonMask, members: aliasedMembers }
				},
			set: (_) => (__) => {},
		})
		const playerCharactersUpdateMasks = AtomIO.selectorFamily<
			Signal<SetRTX<CharacterKey | PlayerKey>>,
			CharacterKey<RT.Alias> | PlayerKey<RT.Alias>
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
			CharacterKey<RT.Alias>
		>({
			key: `positionMask`,
			get: (_) => (__) => {
				return { x: 0, y: 0 }
			},
			set: (_) => (__) => {},
		})
		// const healthAtoms = AtomIO.atomFamily<number, CharacterKey>({
		// 	key: `health`,
		// 	default: 0,
		// })
		// const healthMasks = AtomIO.selectorFamily<
		// 	number | null,
		// 	CharacterKey<RT.Alias>
		// >({
		// 	key: `healthMask`,
		// 	get: (_) => (__) => {
		// 		return 0
		// 	},
		// 	set: (_) => (__) => {},
		// })
		const healthAtoms = AtomIO.atomFamily<number, CharacterKey>({
			key: `health`,
			default: 0,
		})
		const healthMasks = AtomIO.selectorFamily<
			number | null,
			CharacterKey<RT.Alias>
		>({
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
					.add(playerPerspectiveIndices, [
						getInternalRelations(playerCharacters),
						playerCharactersJsonMasks,
						playerCharactersUpdateMasks,
					])
					.add(attackTX),
		})

		const UserAliasSpace: FC<{ myUserAliasKey: UserKey<RT.Alias> }> = ({
			myUserAliasKey,
		}) => {
			const store = useContext(AR.StoreContext)
			const myPlayerKey = `T$--player==game::battle++${myUserAliasKey}` as const
			const myCharacter = AR.useO(
				findRelationsInStore(playerCharacters, myPlayerKey, store)
					.characterKeysOfPlayer,
			)
			console.log({
				myUserAliasKey,
				myPlayerKey,
				myCharacter,
			})

			return (
				<span data-testid={`state`}>
					<span data-testid={`character`}>{myCharacter[0]}</span>
					<span data-testid={`userAlias`}>{myUserAliasKey}</span>
				</span>
			)
		}

		const UserSpace: FC<{ myUserKey: UserKey<RT.Actual> }> = ({ myUserKey }) => {
			const store = useContext(AR.StoreContext)

			RTR.usePullSelector(findInStore(store, userAliasSelectors, myUserKey))
			const myAlias = AR.useO(userAliasSelectors, myUserKey)

			return myAlias ? <UserAliasSpace myUserAliasKey={myAlias} /> : null
		}

		return Object.assign(
			RTTest.multiClient({
				port: 5485,
				server: ({ socket, silo }) => {
					const { store } = silo

					silo.setState(characterGlobalIndex, (prev) =>
						prev.add(`character::__janette__`),
					)
					silo.setState(playerGlobalIndex, (prev) =>
						prev.add(`T$--player==game::battle++user::__jane-1__`),
					)
					editRelationsInStore(
						playerCharacters,
						(relations) => {
							relations.set({
								player: `T$--player==game::battle++user::__jane-1__`,
								character: `character::__janette__`,
							})
						},
						store,
					)

					const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
					const playerAlias = findInStore(
						store,
						getInternalRelationsFromStore(perspectiveAliases, store),
						`T$--perspective==__jane-1__++user::__jane-1__`,
					)
					console.log(`playerAlias`, playerAlias)
					exposeMutable(playerAlias)
					const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
						socket,
						store,
					})
					exposeContinuity(gameContinuity)
				},
				clients: {
					jane: () => {
						RTR.useSyncContinuity(gameContinuity)
						const myUserKeyActual = AR.useO(myUserKeyActualState)
						return myUserKeyActual ? (
							<UserSpace myUserKey={myUserKeyActual} />
						) : null
					},
				},
			}),
			{
				isCharacterKey,
			},
		)
	}

	test(`occlusion`, async () => {
		const { clients, server, teardown, isCharacterKey } = scenario()
		const jane = clients.jane.init()

		jane.enableLogging()

		await waitFor(() => {
			throwUntil(jane.socket.connected)
		})

		let i = 0
		await waitFor(() => {
			i++
			expect(jane.renderResult.getByTestId(`character`).textContent).toSatisfy(
				isCharacterKey,
			)
		})
	})
})
