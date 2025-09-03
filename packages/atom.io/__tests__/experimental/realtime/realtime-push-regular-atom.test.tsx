import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"

let LOGGING: boolean

beforeEach(() => {
	LOGGING = true
})

const countState = AtomIO.atom<number>({ key: `count`, default: 0 })

describe(`pushing state`, () => {
	const Receiver = () => {
		RTR.usePullAtom(countState)
		const count = AR.useO(countState)
		return <i data-testid={count} />
	}

	const Increment = () => {
		RTR.usePush(countState)
		const setCount = AR.useI(countState)
		return (
			<button
				type="button"
				onClick={() => {
					setCount((c) => c + 1)
				}}
				data-testid={`increment`}
			/>
		)
	}

	const ModeSwitchingClient: React.FC<{
		initialState: `client` | `server`
	}> = ({ initialState }) => {
		const [mode, setMode] = React.useState(initialState)
		return (
			<>
				<button
					type="button"
					onClick={() => {
						setMode((m) => (m === `client` ? `server` : `client`))
					}}
					data-testid={`switch`}
				/>
				{mode === `client` ? <Receiver /> : <Increment />}
			</>
		)
	}

	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const provideState = RTS.realtimeStateProvider({ socket, store })

				const mutex = new Set<string>()
				const receiveState = RTS.realtimeStateReceiver({ socket, store, mutex })

				const socketServices = [
					provideState(countState),
					receiveState(countState),
				]
				return () => {
					for (const unsub of socketServices) {
						unsub()
					}
				}
			},
			clients: {
				dave: () => <ModeSwitchingClient initialState={`client`} />,
				jane: () => <ModeSwitchingClient initialState={`server`} />,
			},
		})

	test(`client 1 -> server -> client 2`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		if (LOGGING) {
			jane.enableLogging()
			dave.enableLogging()
		}

		dave.renderResult.getByTestId(`0`)
		act(() => {
			jane.renderResult.getByTestId(`switch`).click()
		})

		await waitFor(() => jane.renderResult.getByTestId(`0`))

		act(() => {
			dave.renderResult.getByTestId(`switch`).click()
		})

		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		await teardown()
	})
})
