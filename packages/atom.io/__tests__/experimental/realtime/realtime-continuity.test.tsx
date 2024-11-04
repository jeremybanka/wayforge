import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import {
	editRelations,
	getInternalRelations,
	getInternalRelationsFromStore,
	join,
} from "atom.io/data"
import type { Signal } from "atom.io/internal"
import { actUponStore, arbitrary, getUpdateToken } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { is } from "drizzle-orm"
import * as React from "react"

import { throwUntil } from "../../__util__/waiting"

describe(`synchronizing transactions`, () => {
	const scenario = () => {
		const countState = AtomIO.atom<number>({ key: `count`, default: 0 })
		const userActionCountServerState = AtomIO.atom<number>({
			key: `server:userActionCount`,
			default: 0,
		})

		const incrementTX = AtomIO.transaction({
			key: `increment`,
			do: ({ set, env }) => {
				const { name } = env().store.config
				if (name === `SERVER`) {
					set(userActionCountServerState, (c) => c + 1)
				}
				set(countState, (c) => c + 1)
			},
		})
		const countContinuity = RT.continuity({
			key: `count`,
			config: (group) => group.add(countState).add(incrementTX),
		})

		return Object.assign(
			RTTest.multiClient({
				port: 5465,
				immortal: { server: true },
				server: ({ socket, silo: { store } }) => {
					const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
						socket,
						store,
					})
					exposeContinuity(countContinuity)
				},
				clients: {
					jane: () => {
						RTR.useSyncContinuity(countContinuity)
						const count = AR.useO(countState)
						const store = React.useContext(AR.StoreContext)
						const increment = actUponStore(incrementTX, arbitrary(), store)

						return (
							<>
								<button
									type="button"
									onClick={() => increment()}
									data-testid={`increment`}
								/>
								<i data-testid={count} />
							</>
						)
					},
					dave: () => {
						RTR.useSyncContinuity(countContinuity)
						const count = AR.useO(countState)
						const store = React.useContext(AR.StoreContext)
						const increment = actUponStore(incrementTX, arbitrary(), store)
						return (
							<>
								<button
									type="button"
									onClick={() => increment()}
									data-testid={`increment`}
								/>
								<i data-testid={count} />
							</>
						)
					},
				},
			}),
			{ countState, incrementTX },
		)
	}
	test(`client 1 -> server -> client 2`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		await teardown()
	})
	test(`rollback`, async () => {
		const { server, clients, teardown, countState } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		// dave.enableLogging()

		await waitFor(() => {
			throwUntil(jane.socket.connected)
		})
		await waitFor(() => {
			throwUntil(dave.socket.connected)
		})

		dave.socket.disconnect()

		act(() => {
			jane.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => server.silo.getState(countState) === 1)

		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})

		await waitFor(() => jane.renderResult.getByTestId(`1`))
		await waitFor(() => dave.renderResult.getByTestId(`1`))

		dave.socket.connect()
		await waitFor(() => {
			throwUntil(dave.socket.connected)
		})

		await waitFor(() => jane.renderResult.getByTestId(`2`))
		await waitFor(() => dave.renderResult.getByTestId(`2`), { timeout: 30000 })

		await teardown()
	})
})

describe(`mutable atoms in continuity`, () => {
	const scenario = () => {
		const myListAtom = AtomIO.atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myList`,
			default: () => new SetRTX<string>(),
			mutable: true,
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})

		const addItemTX = AtomIO.transaction<(item: string) => void>({
			key: `addItem`,
			do: ({ set }, item) => {
				set(myListAtom, (list) => list.add(item))
			},
		})

		const applicationContinuity = RT.continuity({
			key: `application`,
			config: (group) => group.add(myListAtom).add(addItemTX),
		})

		return Object.assign(
			RTTest.singleClient({
				port: 5475,
				server: ({ socket, silo: { store }, enableLogging }) => {
					enableLogging()
					const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
						socket,
						store,
					})
					exposeContinuity(applicationContinuity)
				},
				client: () => {
					RTR.useSyncContinuity(applicationContinuity)
					const myList = AR.useJSON(myListAtom)

					return <span data-testid={`state`}>{myList.members.length}</span>
				},
			}),
			{ myListAtom, addItemTX },
		)
	}
	test(`mutable initialization`, async () => {
		const { client, server, teardown, addItemTX, myListAtom } = scenario()
		const clientApp = client.init()

		clientApp.enableLogging()
		await waitFor(() => {
			throwUntil(clientApp.socket.connected)
		})
		const clientState = clientApp.renderResult.getByTestId(`state`)
		expect(clientState.textContent).toBe(`0`)
		act(() => {
			server.silo.runTransaction(addItemTX)(`hello`)
		})
		expect(clientApp.renderResult.getByTestId(`state`).textContent).toBe(`0`)
		await waitFor(() => clientApp.renderResult.getByTestId(`state`).textContent)
		expect(clientApp.renderResult.getByTestId(`state`).textContent).toBe(`1`)

		const time = performance.now()
		act(() => {
			clientApp.silo.runTransaction(addItemTX)(`world`)
		})
		await waitFor(() => {
			throwUntil(() => server.silo.getState(myListAtom).has(`world`))
		})
		console.log(`📝 took ${performance.now() - time}ms`)
		await teardown()
	})
})

describe.only(`join in perspective`, () => {
	const scenario = () => {
		// HIERARCHY
		type GameKey = `game::${string}`
		const isGameKey = (key: string): key is GameKey => key.startsWith(`game::`)
		type UserKey = `user::${string}`
		const isUserKey = (key: string): key is UserKey => key.startsWith(`user::`)
		type PlayerKey = `T$--player==${GameKey}++${UserKey}`
		const isPlayerKey = (key: string): key is PlayerKey =>
			key.startsWith(`T$--player==game::`)
		type CharKey<K extends RT.Actual | RT.Alias = RT.Actual | RT.Alias> =
			`char::${K}`
		const isCharKey = (key: string): key is CharKey => key.startsWith(`char::`)
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
					below: [ItemKey, CharKey]
				},
				{
					above: PlayerKey
					below: [ItemKey, CharKey]
				},
			]
		>

		// STATES
		type CharViewKey = AtomIO.Compound<`view`, CharKey<RT.Actual>, UserKey>
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
			isBType: isUserKey,
		})

		const playerCharacters = join({
			key: `playersOfCharacters`,
			between: [`player`, `character`],
			cardinality: `1:n`,
			isAType: isPlayerKey,
			isBType: isCharKey,
		})
		const playerCharactersJsonMasks = AtomIO.selectorFamily<
			SetRTXJson<CharKey | PlayerKey>,
			CharKey | PlayerKey
		>({
			key: `playerCharacterJsonMask`,
			get:
				(characterRelationKey) =>
				({ env, find, get, json }) => {
					console.log(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)
					const { store } = env()
					return get(
						json(
							find(
								getInternalRelationsFromStore(playerCharacters, store),
								characterRelationKey,
							),
						),
					)
				},
			set: (_) => (__) => {},
		})
		const playerCharactersUpdateMasks = AtomIO.selectorFamily<
			Signal<SetRTX<CharKey | PlayerKey>>,
			CharKey | PlayerKey
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
			CharKey
		>({
			key: `position`,
			default: { x: 0, y: 0 },
		})
		const characterPositionMasks = AtomIO.selectorFamily<
			{ x: number; y: number } | null,
			CharKey
		>({
			key: `positionMask`,
			get: (_) => (__) => {
				return { x: 0, y: 0 }
			},
			set: (_) => (__) => {},
		})
		const healthAtoms = AtomIO.atomFamily<number, CharKey>({
			key: `health`,
			default: 0,
		})
		const healthMasks = AtomIO.selectorFamily<number | null, CharKey>({
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

		const attackTX = AtomIO.transaction<(defender: CharKey) => void>({
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
				enableLogging()
				silo.setState(characterGlobalIndex, (prev) =>
					prev.add(`char::__janette__`),
				)
				editRelations(playerCharacters, (relations) => {
					relations.set({
						player: `T$--player==game::battle++user::jane`,
						character: `char::__janette__`,
					})
				})
				editRelations(playerCharacters, (relations) => {
					relations.set({
						player: `T$--player==game::battle++user::jane`,
						character: `char::__janette__`,
					})
				})
				const exposeContinuity = RTS.prepareToExposeRealtimeContinuity({
					socket,
					store,
				})
				exposeContinuity(gameContinuity)
			},
			clients: {
				jane: () => {
					RTR.useSyncContinuity(gameContinuity)
					const myUsername = AR.useO(myUsernameState)
					console.log(myUsername)

					return <span data-testid={`state`}>{myUsername}</span>
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
	})
})
