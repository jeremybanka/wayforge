import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"

AtomIO.getState(RTC.myIdState)
const countState = AtomIO.atom({ key: `count`, default: 0 })
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

describe(`synchronizing transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				// store.loggers[0].logLevel = `info`
				// socket.onAny((event, ...args) => {
				// 	console.log(`🛰 `, event, ...args)
				// })
				// socket.onAnyOutgoing((event, ...args) => {
				// 	console.log(`🛰  >>`, event, ...args)
				// })
				const syncTX = RTS.realtimeActionSynchronizer({ socket, store })
				const syncState = RTS.realtimeStateSynchronizer({ socket, store })
				syncTX(incrementTX, (updates) =>
					updates.filter((u) => {
						if (u.key === `count`) {
							return true
						}
					}),
				)
				syncState(countState)
			},
			clients: {
				dave: () => {
					const increment = RTR.useSyncAction(incrementTX)
					// const store = React.useContext(AR.StoreContext)
					// const { socket } = React.useContext(RTR.RealtimeContext)
					// socket?.onAny((event, ...args) => {
					// 	console.log(`📡 DAVE`, event, ...args)
					// })
					// socket?.onAnyOutgoing((event, ...args) => {
					// 	console.log(`📡 DAVE >>`, event, ...args)
					// })
					return (
						<button
							type="button"
							onClick={() => increment()}
							data-testid={`increment`}
						/>
					)
				},
				jane: () => {
					const count = RTR.useSync(countState)
					const increment = RTR.useSyncAction(incrementTX)
					// const store = React.useContext(AR.StoreContext)
					// store.loggers[0].logLevel = `info`
					// const { socket } = React.useContext(RTR.RealtimeContext)
					// console.log(`📡 JANE`, socket?.listeners)
					// socket?.onAny((event, ...args) => {
					// 	console.log(`📡 JANE`, event, ...args)
					// })
					// socket?.onAnyOutgoing((event, ...args) => {
					// 	console.log(`📡 JANE >>`, event, ...args)
					// })
					return <i data-testid={count} />
				},
			},
		})

	test(`client 1 -> server -> client 2`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`increment`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
