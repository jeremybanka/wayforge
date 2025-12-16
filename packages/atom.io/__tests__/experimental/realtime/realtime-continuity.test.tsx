import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { actUponStore, arbitrary } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { UList } from "atom.io/transceivers/u-list"
import * as React from "react"

import * as Utils from "../../__util__"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined

describe(`synchronizing transactions`, () => {
	const runScenario = () => {
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

		const Client = () => {
			RTR.useSyncContinuity(countContinuity)
			const count = AR.useO(countState)
			const store = React.useContext(AR.StoreContext)
			const increment = actUponStore(store, incrementTX, arbitrary())
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
		}

		return Object.assign(
			RTTest.multiClient({
				immortal: { server: true },
				server: ({ socket, userKey, silo: { store }, enableLogging }) => {
					enableLogging()
					const exposeContinuity = RTS.prepareToProvideContinuity({
						socket,
						consumer: userKey,
						store,
					})
					exposeContinuity(countContinuity, userKey)
				},
				clients: {
					jane: Client,
					dave: Client,
				},
			}),
			{ countState, incrementTX },
		)
	}

	let scenario: ReturnType<typeof runScenario>
	let dave: RTTest.RealtimeTestClient
	let jane: RTTest.RealtimeTestClient
	let server: RTTest.RealtimeTestServer
	let teardown: () => Promise<void>

	beforeEach(() => {
		scenario = runScenario()
		dave = scenario.clients.dave.init()
		jane = scenario.clients.jane.init()
		server = scenario.server
		teardown = scenario.teardown

		jane.enableLogging()
		dave.enableLogging()

		vitest.spyOn(dave.silo.store.logger, `error`)
		vitest.spyOn(dave.silo.store.logger, `warn`)
		vitest.spyOn(dave.silo.store.logger, `info`)
		vitest.spyOn(jane.silo.store.logger, `error`)
		vitest.spyOn(jane.silo.store.logger, `warn`)
		vitest.spyOn(jane.silo.store.logger, `info`)
		vitest.spyOn(server.silo.store.logger, `error`)
		vitest.spyOn(server.silo.store.logger, `warn`)
		vitest.spyOn(server.silo.store.logger, `info`)
		vitest.spyOn(Utils, `stdout`)
	})

	afterEach(async () => {
		expect(dave.silo.store.logger.warn).not.toHaveBeenCalled()
		expect(dave.silo.store.logger.error).not.toHaveBeenCalled()
		expect(jane.silo.store.logger.warn).not.toHaveBeenCalled()
		expect(jane.silo.store.logger.error).not.toHaveBeenCalled()

		await teardown()
	})

	test(`client 1 -> server -> client 2`, async () => {
		jane.renderResult.getByTestId(`0`)
		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
	})
	test(`rollback`, async () => {
		const { countState } = scenario

		await waitFor(() => {
			Utils.throwUntil(jane.socket.connected)
		})
		await waitFor(() => {
			Utils.throwUntil(dave.socket.connected)
		})

		dave.socket.disconnect()

		await act(async () => {
			jane.renderResult.getByTestId(`increment`).click()
			await waitFor(() => jane.renderResult.getByTestId(`1`))
			await waitFor(() => server.silo.getState(countState) === 1)
		})

		await act(async () => {
			dave.renderResult.getByTestId(`increment`).click()
			await waitFor(() => dave.renderResult.getByTestId(`1`))
		})

		dave.socket.connect()
		await waitFor(async () => {
			Utils.throwUntil(dave.socket.connected)
			await waitFor(() => jane.renderResult.getByTestId(`2`))
			await waitFor(() => dave.renderResult.getByTestId(`2`))
		})
	})
})

describe(`mutable atoms in continuity`, () => {
	const scenario = () => {
		const myListAtom = AtomIO.mutableAtom<UList<string>>({
			key: `myList`,
			class: UList,
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
				server: ({ socket, userKey, silo: { store } }) => {
					// enableLogging()
					const exposeContinuity = RTS.prepareToProvideContinuity({
						socket,
						consumer: userKey,
						store,
					})
					return exposeContinuity(applicationContinuity, userKey)
				},
				client: () => {
					RTR.useSyncContinuity(applicationContinuity)
					const myList = AR.useJSON(myListAtom)

					return <span data-testid={`state`}>{myList.length}</span>
				},
			}),
			{ myListAtom, addItemTX },
		)
	}
	test(`mutable initialization`, async () => {
		const { client, server, addItemTX, myListAtom, teardown } = scenario()
		const clientApp = client.init()
		clientApp.enableLogging()
		await waitFor(() => {
			Utils.throwUntil(clientApp.socket.connected)
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
			Utils.throwUntil(() => server.silo.getState(myListAtom).has(`world`))
		})
		console.log(`📝 took ${performance.now() - time}ms`)

		await teardown()
	})
})
