import { waitFor } from "@testing-library/react"
import type { Compound, TransactionUpdate } from "atom.io"
import * as AtomIO from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
import {
	editRelations,
	editRelationsInStore,
	findRelationsInStore,
	getInternalContentFromStore,
	getInternalRelations,
	getInternalRelationsFromStore,
	join,
} from "atom.io/data"
import type { Signal } from "atom.io/internal"
import { findInStore, getUpdateToken, IMPLICIT } from "atom.io/internal"
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
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import type { FC } from "react"
import { useContext } from "react"

import { mark } from "../../__util__"
import { throwUntil } from "../../__util__/waiting"

test(`decomposeCompoundKey`, () => {
	expect(
		AtomIO.decomposeCompoundKey(
			`T$--mask==user::__jane-1__++T$--player==game::battle++user::__jane-1__`,
		),
	).toEqual([
		`T$--mask`,
		`user::__jane-1__`,
		`T$--player==game::battle++user::__jane-1__`,
	])
	expect(
		AtomIO.decomposeCompoundKey(
			`T$--mask==T$--player==game::battle++user::__jane-1__++user::__jane-1__`,
		),
	).toEqual([
		`T$--mask`,
		`T$--player==game::battle++user::__jane-1__`,
		`user::__jane-1__`,
	])
})

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
			AtomIO.Tag<`mask`>,
			UserKey<RT.Actual>,
			ItemKey<RT.Actual>
		>
		const itemWeightAtoms = atomFamily<number, ItemKey>({
			key: `weight`,
			default: 0,
		})
		const itemWeightMasks = selectorFamily<
			number | `???`,
			Compound<AtomIO.Tag<`mask`>, UserKey<RT.Actual>, ItemKey<RT.Actual>>
		>({
			key: `weightMask`,
			get: (_) => (__) => {
				return `???`
			},
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
				group.perspective(itemPerspectiveIndices, [
					itemWeightAtoms,
					itemWeightMasks,
				]),
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

describe.only(`join in perspective`, () => {
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

		const {
			globalIndex: characterGlobalIndex,
			perspectiveIndices: characterPerspectiveIndices,
		} = RT.view({
			key: `character`,
			selectors: AtomIO.selectorFamily<
				RT.VisibilityCondition,
				RT.MaskKey<CharacterKey<RT.Actual>>
			>({
				key: `characterVisibility`,
				get: (_) => (__) => {
					return `masked`
				},
			}),
		})
		const {
			globalIndex: playerGlobalIndex,
			perspectiveIndices: playerPerspectiveIndices,
		} = RT.view({
			key: `player`,
			selectors: AtomIO.selectorFamily<
				RT.VisibilityCondition,
				RT.MaskKey<PlayerKey<RT.Actual>>
			>({
				key: `playerVisibility`,
				get: (_) => (__) => {
					return `masked`
				},
			}),
		})

		const currentGameKeyAtom = AtomIO.atom<GameKey>({
			key: `currentGameKey`,
			default: `game::battle`,
		})

		const worldTimeAtom = AtomIO.atom<number>({ key: `worldTime`, default: 0 })

		const playersOfGames = join(
			{
				key: `players`,
				between: [`game`, `user`],
				cardinality: `1:n`,
				isAType: isGameKey,
				isBType: RTS.isUserKey,
			},
			{ playerKey: `X` as PlayerKey },
		)

		const gameIndex = AtomIO.atom<SetRTX<GameKey>, SetRTXJson<GameKey>>({
			key: `gameIndex`,
			mutable: true,
			default: () => new SetRTX<GameKey>(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})

		const playersOfGamesJsonMasks = AtomIO.selectorFamily<
			SetRTXJson<UserKey<RT.Alias>>,
			RT.MaskKey<GameKey> | RT.MaskKey<UserKey<RT.Actual>>
		>({
			key: `playersOfGamesJsonMask`,
			get:
				(maskKey) =>
				({ env, find, get, json }) => {
					const { store } = env()
					const [, userKey, gameUserRelationKey] =
						AtomIO.decomposeCompoundKey(maskKey)
					const jsonRelationsUnmasked = get(
						json(
							find(
								getInternalRelationsFromStore(playersOfGames, store),
								gameUserRelationKey,
							),
						),
					)
					if (jsonRelationsUnmasked.members.includes(userKey)) {
						const aliasedPlayerKeys: UserKey<RT.Alias>[] = []
						for (const memberKey of jsonRelationsUnmasked.members) {
							if (RTS.isActualUserKey(memberKey)) {
								const [memberActuals, compileAliasedKeys] =
									RT.extractActualKeys(memberKey)
								const memberAliases: RT.Alias[] = []
								for (const actual of memberActuals) {
									const perspectiveKey: RT.PerspectiveKey = `T$--perspective==${actual}++${userKey}`
									const alias = get(
										findRelationsInStore(
											perspectiveAliases,
											perspectiveKey,
											store,
										).aliasKeyOfPerspective,
									)
									if (alias) {
										memberAliases.push(alias)
									}
								}
								const aliasKey = compileAliasedKeys(memberAliases)
								aliasedPlayerKeys.push(aliasKey)
							}
						}
						return {
							...jsonRelationsUnmasked,
							members: aliasedPlayerKeys,
						}
					}
					return new SetRTX<UserKey<RT.Alias>>().toJSON()
				},
		})

		const playersOfGamesUpdateMasks = AtomIO.selectorFamily<
			Signal<SetRTX<UserKey<RT.Alias>>>,
			RT.MaskKey<GameKey>
		>({
			key: `playersOfGamesUpdateMask`,
			get:
				(maskKey) =>
				({ find, get }) => {
					const [, , gameUserRelationKey] = AtomIO.decomposeCompoundKey(maskKey)
					return get(
						getUpdateToken(
							find(getInternalRelations(playersOfGames), gameUserRelationKey),
						),
					)
				},
		})

		const myGameKeySelector = AtomIO.selector<GameKey | null>({
			key: `myGameKey`,
			get: ({ env, get }) => {
				const { store } = env()
				const myKey = get(myUserKeyActualState)
				if (myKey === null) {
					return null
				}
				const gameKey = get(
					findRelationsInStore(playersOfGames, myKey, store).gameKeyOfUser,
				)
				if (gameKey === null) {
					return null
				}
				return gameKey
			},
		})

		const myAliasSelector = AtomIO.selector<UserKey<RT.Alias> | null>({
			key: `myAlias`,
			get: ({ env, get }) => {
				const { store } = env()
				const myKey = get(myUserKeyActualState)
				if (myKey === null) {
					return null
				}
				const actual = RT.extractActualKeys(myKey)[0][0]
				const perspectiveKey: RT.PerspectiveKey = `T$--perspective==${actual}++${myKey}`
				const userAlias = get(
					findRelationsInStore(perspectiveAliases, perspectiveKey, store)
						.aliasKeyOfPerspective,
				)
				if (userAlias) {
					return `user::${userAlias}`
				}
				return null
			},
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
			RT.MaskKey<CharacterKey<RT.Actual> | PlayerKey<RT.Actual>>
		>({
			key: `playerCharacterJsonMask`,
			get:
				(maskKey) =>
				({ env, find, get, json }) => {
					const { store } = env()
					const [, ownerKey, playerCharacterRelationKey] =
						AtomIO.decomposeCompoundKey(maskKey)
					const jsonUnmasked = get(
						json(
							find(
								getInternalRelationsFromStore(playerCharacters, store),
								playerCharacterRelationKey,
							),
						),
					)
					if (isPlayerKey(playerCharacterRelationKey)) {
						const playerKey = playerCharacterRelationKey
						const [, , userKey] = AtomIO.decomposeCompoundKey(playerKey)
						if (userKey !== ownerKey) {
							return {
								...jsonUnmasked,
								members: [],
							}
						}
					}

					const aliasedMembers: (
						| CharacterKey<RT.Alias>
						| PlayerKey<RT.Alias>
					)[] = []
					for (const memberKey of jsonUnmasked.members) {
						if (RT.holdsActuals(memberKey)) {
							const [memberActuals, compileAliasedKeys] =
								RT.extractActualKeys(memberKey)
							const memberAliases: RT.Alias[] = []
							for (const actual of memberActuals) {
								const perspectiveKey =
									`T$--perspective==${actual}++${ownerKey}` as const
								const alias = get(
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

					return {
						...jsonUnmasked,
						members: aliasedMembers,
					}
				},
		})
		const playerCharactersUpdateMasks = AtomIO.selectorFamily<
			Signal<SetRTX<CharacterKey<RT.Alias> | PlayerKey<RT.Alias>>>,
			Compound<
				AtomIO.Tag<`mask`>,
				UserKey<RT.Actual>,
				CharacterKey<RT.Actual> | PlayerKey<RT.Actual>
			>
		>({
			key: `playerCharacterUpdateMask`,
			get:
				(maskKey) =>
				({ find, get }) => {
					const [, , characterRelationKey] = AtomIO.decomposeCompoundKey(maskKey)
					return get(
						getUpdateToken(
							find(getInternalRelations(playerCharacters), characterRelationKey),
						),
					)
				},
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
		const healthAtoms = AtomIO.atomFamily<number, CharacterKey>({
			key: `health`,
			default: 0,
		})
		const healthMasks = AtomIO.selectorFamily<
			number | null,
			Compound<AtomIO.Tag<`mask`>, UserKey<RT.Actual>, CharacterKey<RT.Actual>>
		>({
			key: `healthMask`,
			get: (_) => (__) => {
				return 0
			},
		})
		function mask<T, K extends Canonical>(
			actual: AtomIO.AtomFamilyToken<T, K>,
			_: AtomIO.ReadableFamilyToken<T, K>,
		): AtomIO.WritableFamilyToken<T, K> {
			return actual
		}

		const attackTX = AtomIO.transaction<
			(
				userKey: UserKey<RT.Actual>,
				attackerKey: CharacterKey,
				defenderKey: CharacterKey,
			) => void
		>({
			key: `increment`,
			do: ({ set }, userKey, attackerKey, defenderKey) => {
				console.log({ userKey, attackerKey, defenderKey })
				set(mask(healthAtoms, healthMasks), defenderKey, (health) =>
					health === null ? null : health - 10,
				)
			},
		})

		const createCharacterTX = AtomIO.transaction<
			(userKey: UserKey<RT.Actual>, alias: RT.Alias) => void
		>({
			key: `createCharacter`,
			do: ({ get, env, set }, userKey, alias) => {
				const { store } = env()
				let practicalCharacterKey: CharacterKey = `character::${alias}`
				let practicalUserKey: UserKey = userKey
				if (store.config.name === `SERVER-1`) {
					// validations
					// id must be 8 characters base 64
					const idIsValid =
						alias.length === 12 && /^\$\$[0-9a-zA-Z]+\$\$$/.test(alias)
					if (!idIsValid) {
						throw new Error(`Character ID must be 8 characters base 64`)
					}
					// id must not already exist as an alias to this user
					if (
						get(
							findRelationsInStore(perspectiveAliases, alias, store)
								.perspectiveKeyOfAlias,
						)
					) {
						throw new Error(`Character ID already exists as an alias`)
					}

					const actualId: RT.Actual = `__${Math.random().toString(36).slice(2, 10)}__`
					const actualCharacterKey: CharacterKey<RT.Actual> = `character::${actualId}`
					practicalCharacterKey = actualCharacterKey
				} else {
					// const aliasUserKey = get(myAliasSelector)
					// if (aliasUserKey === null) {
					// 	throw new Error(`You have not retrieved your user alias.`)
					// }
					// practicalUserKey = aliasUserKey
				}
				console.log(`💥 practicalUserKey`, practicalUserKey)
				const gameEntry = get(
					findRelationsInStore(playersOfGames, practicalUserKey, store)
						.gameEntryOfUser,
				)
				if (gameEntry === null) {
					throw new Error(`User is not in a game`)
				}
				const [, { playerKey }] = gameEntry

				set(characterGlobalIndex, (prev) => prev.add(practicalCharacterKey))
				editRelationsInStore(
					playerCharacters,
					(relations) => {
						relations.set({
							player: playerKey,
							character: practicalCharacterKey,
						})
					},
					store,
				)
			},
		})

		const gameContinuity = RT.continuity({
			key: `game`,
			config: (group) =>
				group
					.actions(attackTX)
					.actions(createCharacterTX)
					.globals(currentGameKeyAtom, worldTimeAtom)
					.maskedDynamic(gameIndex, {
						base: getInternalRelations(playersOfGames),
						jsonMask: playersOfGamesJsonMasks,
						signalMask: playersOfGamesUpdateMasks,
					})
					.perspective(
						characterPerspectiveIndices,
						[healthAtoms, healthMasks],
						[
							getInternalRelations(playerCharacters),
							playerCharactersJsonMasks,
							playerCharactersUpdateMasks,
						],
					)
					.perspective(playerPerspectiveIndices, [
						getInternalRelations(playerCharacters),
						playerCharactersJsonMasks,
						playerCharactersUpdateMasks,
					]),
		})

		const GameSpace: FC<{
			myGameKey: GameKey
			myAlias: UserKey<RT.Alias>
		}> = ({ myGameKey, myAlias }) => {
			const store = useContext(AR.StoreContext)
			const myPlayerKey = `T$--player==${myGameKey}++${myAlias}` as const
			const myCharacterKeys = AR.useO(
				findRelationsInStore(playerCharacters, myPlayerKey, store)
					.characterKeysOfPlayer,
			)
			console.log({
				myPlayerKey,
				myCharacterKeys,
			})

			return (
				<span data-testid={`state`}>
					{myCharacterKeys.map((characterKey) => (
						<span key={characterKey} data-testid={`character`}>
							{characterKey}
						</span>
					))}
					<span data-testid={`userAlias`}>{myPlayerKey}</span>
				</span>
			)
		}

		return Object.assign(
			RTTest.multiClient({
				port: 5485,
				server: ({ socket, silo, enableLogging }) => {
					enableLogging({ ws: true })
					const { store } = silo
					silo.setState(playerGlobalIndex, (prev) =>
						prev.add(`T$--player==game::battle++user::__jane-1__`),
					)
					const socketUser = silo.getState(
						findRelationsInStore(
							RTS.usersOfSockets,
							`socket::${socket.id}`,
							store,
						).userKeyOfSocket,
					)

					console.log(`😽`, socketUser)
					if (socketUser === null) {
						throw new Error(`No user found for socket`)
					}
					silo.setState(gameIndex, (prev) => prev.add(`game::battle`))
					editRelationsInStore(
						playersOfGames,
						(relations) => {
							relations.set(
								{
									user: socketUser,
									game: `game::battle`,
								},
								{ playerKey: `T$--player==game::battle++user::__jane-1__` },
							)
						},
						store,
					)
					const userGame = silo.getState(
						findRelationsInStore(playersOfGames, socketUser, store)
							.gameKeyOfUser,
					)
					if (userGame === null) {
						throw new Error(`No game found for user`)
					}

					const exposeRegular = RTS.realtimeStateProvider({ socket, store })
					const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
					const playerAlias = findInStore(
						store,
						getInternalRelationsFromStore(perspectiveAliases, store),
						`T$--perspective==__jane-1__++user::__jane-1__`,
					)
					console.log(`playerAlias`, playerAlias)
					const userGameAtom = findInStore(
						store,
						getInternalRelationsFromStore(playersOfGames, store),
						socketUser,
					)
					console.log(`userGame`, userGame)
					const gamePlayerContentAtoms = getInternalContentFromStore(
						store,
						playersOfGames,
					)
					const userGamePlayer = findInStore(
						store,
						gamePlayerContentAtoms,
						`${userGame}:${socketUser}`,
					)
					exposeRegular(userGamePlayer)
					exposeMutable(playerAlias)
					exposeMutable(userGameAtom)

					const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
						socket,
						store,
					})
					exposeContinuity(gameContinuity)
				},
				clients: {
					jane: () => {
						RTR.useSyncContinuity(gameContinuity)
						RTR.usePullSelector(myAliasSelector)
						RTR.usePullSelector(myGameKeySelector)
						const myAlias = AR.useO(myAliasSelector)
						const myGameKey = AR.useO(myGameKeySelector)

						console.log(`❗❗❗❗❗`, { myGameKey })

						return myGameKey && myAlias ? (
							<GameSpace myAlias={myAlias} myGameKey={myGameKey} />
						) : null
					},
				},
			}),
			{
				isCharacterKey,
				createCharacterTX,
			},
		)
	}

	test(`occlusion`, async () => {
		const { clients, server, teardown, isCharacterKey, createCharacterTX } =
			scenario()
		const jane = clients.jane.init()

		/*
		- jane retrieves her perspective on the game continuity
		- jane retrieves her user alias from her true user key
		- jane retrieves her game key from her true user key
		- jane retrieves her aliased player key from her user alias and game key
		- jane creates a character as herself (unaliased)
		- the transaction results in a new character joined to her aliased player key
		*/
		jane.enableLogging({ ws: true })

		await waitFor(() => {
			throwUntil(jane.socket.connected)
		})

		jane.silo.runTransaction(createCharacterTX)(
			`user::__jane-1__`,
			`$$00000000$$`,
		)

		let i = 0
		await waitFor(() => {
			i++
			expect(jane.renderResult.getByTestId(`character`).textContent).toSatisfy(
				isCharacterKey,
			)
		})
	})
})
