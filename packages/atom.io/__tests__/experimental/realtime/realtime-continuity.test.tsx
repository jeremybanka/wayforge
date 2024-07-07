import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { findRelations, findRelationsInStore, join } from "atom.io/data"
import type { Store } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	findInStore,
	getFromStore,
} from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as React from "react"

import { throwUntil } from "../../__util__/waiting"

function prefixLogger(store: Store, prefix: string) {
	store.loggers[0] = new AtomIO.AtomIOLogger(`info`, undefined, {
		info: (...args) => {
			console.info(prefix, ...args)
		},
		warn: (...args) => {
			console.warn(prefix, ...args)
		},
		error: (...args) => {
			console.error(prefix, ...args)
		},
	})
}

// AtomIO.getState(RTC.myIdState)

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

		return RTTest.multiClient({
			port: 5465,
			server: ({ socket, silo: { store } }) => {
				// const userKeyState = findInStore(
				// 	RTS.usersOfSockets.states.userKeyOfSocket,
				// 	socket.id,
				// 	store,
				// )
				// const userKey = getFromStore(userKeyState, store)
				// prefixLogger(store, `server`)
				// socket.onAny((event, ...args) => {
				// 	console.log(`🛰 `, userKey, event, ...args)
				// })
				// socket.onAnyOutgoing((event, ...args) => {
				// 	console.log(`🛰  >>`, userKey, event, ...args)
				// })

				const syncContinuity = RTS.realtimeContinuitySynchronizer({
					socket,
					store,
				})

				syncContinuity(countContinuity)
			},
			clients: {
				jane: () => {
					RTR.useSyncContinuity(countContinuity)
					const count = AR.useO(countState)
					const store = React.useContext(AR.StoreContext)
					const increment = actUponStore(incrementTX, arbitrary(), store)
					// prefixLogger(store, `jane`)
					// const { socket } = React.useContext(RTR.RealtimeContext)
					// socket?.onAny((event, ...args) => {
					// 	console.log(`📡 JANE`, event, ...args)
					// })
					// socket?.onAnyOutgoing((event, ...args) => {
					// 	console.log(`📡 JANE >>`, event, ...args)
					// })
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
					// prefixLogger(store, `dave`)
					// const { socket } = React.useContext(RTR.RealtimeContext)
					// socket?.onAny((event, ...args) => {
					// 	console.log(`📡 DAVE`, event, ...args)
					// })
					// socket?.onAnyOutgoing((event, ...args) => {
					// 	console.log(`📡 DAVE >>`, event, ...args)
					// })
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
		})
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
		teardown()
	})
	test(`rollback`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		await waitFor(() => {
			throwUntil(jane.socket.connected)
		})
		await waitFor(() => {
			throwUntil(dave.socket.connected)
		})

		act(() => {
			jane.renderResult.getByTestId(`increment`).click()
		})
		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})

		await waitFor(() => jane.renderResult.getByTestId(`2`))
		await waitFor(() => dave.renderResult.getByTestId(`2`), { timeout: 7000 })
		teardown()
	})
})

describe(`mutable atoms in continuity`, () => {
	const scenario = () => {
		// const topicsOfSubjects = join({
		// 	key: `topicsOfSubjects`,
		// 	between: [`topic`, `subject`],
		// 	cardinality: `1:n`,
		// })

		const myListAtom = AtomIO.atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myList`,
			default: () => new SetRTX<string>(),
			mutable: true,
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})

		const addItemTX = AtomIO.transaction<(item: string) => void>({
			key: `addItem`,
			do: ({ get, set }, item) => {
				const myList = get(myListAtom)
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
				server: ({ socket, silo: { store } }) => {
					const userKeyState = findRelationsInStore(
						RTS.usersOfSockets,
						socket.id,
						store,
					).userKeyOfSocket
					const userKey = getFromStore(userKeyState, store)
					prefixLogger(store, `server`)
					socket.onAny((event, ...args) => {
						console.log(`🛰 `, userKey, event, ...args)
					})
					socket.onAnyOutgoing((event, ...args) => {
						console.log(`🛰  >>`, userKey, event, ...args)
					})
					const exposeContinuity = RTS.realtimeContinuitySynchronizer({
						socket,
						store,
					})
					exposeContinuity(applicationContinuity)
				},
				client: () => {
					RTR.useSyncContinuity(applicationContinuity)
					// RTR.usePullMutable(myListAtom)
					const store = React.useContext(AR.StoreContext)
					prefixLogger(store, `client`)
					const { socket } = React.useContext(RTR.RealtimeContext)
					socket?.onAny((event, ...args) => {
						console.log(`📡 CLIENT`, event, ...args)
					})
					socket?.onAnyOutgoing((event, ...args) => {
						console.log(`📡 CLIENT >>`, event, ...args)
					})
					const myList = AR.useJSON(myListAtom)

					return (
						<>
							<button
								type="button"
								// onClick={() => {
								// 	myList.add(`hello`)
								// }}
								data-testid={`add`}
							/>
							<span data-testid={`state`}>{myList.members.length}</span>
						</>
					)
				},
			}),
			{ myListAtom, addItemTX },
		)
	}
	test(`mutable initialization`, async () => {
		const { client, server, teardown, myListAtom, addItemTX } = scenario()
		const clientApp = client.init()
		await waitFor(() => {
			throwUntil(clientApp.socket.connected)
		})
		const clientState = clientApp.renderResult.getByTestId(`state`)
		expect(clientState.textContent).toBe(`0`)
		act(() => {
			server.silo.runTransaction(addItemTX)(`hello`)
		})
		await waitFor(() => clientApp.renderResult.getByTestId(`state`).textContent)
		expect(clientApp.renderResult.getByTestId(`state`).textContent).toBe(`1`)
		teardown()
	})
})
