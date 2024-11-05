import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { actUponStore, arbitrary } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
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
