import { act, waitFor } from "@testing-library/react"
import { type } from "arktype"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined
let LOGGING: boolean
beforeEach(() => (LOGGING = true))

const countState = AtomIO.atom<number>({ key: `count`, default: 0 })

describe(`pushing state`, () => {
	const Receiver = () => {
		RTR.usePullAtom(countState)
		const count = AR.useO(countState)
		return <i data-testid={count} />
	}

	const Increment = () => {
		const setCount = RTR.usePush(countState)
		return setCount ? (
			<button
				type="button"
				onClick={() => {
					setCount((c) => c + 1)
				}}
				data-testid={`increment`}
			/>
		) : (
			<span data-testid={`waiting-for-mutex`} />
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
			server: ({ socket, userKey, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const provideState = RTS.realtimeStateProvider({
					consumer: userKey,
					socket,
					store,
				})

				const receiveState = RTS.realtimeStateReceiver({
					socket,
					consumer: userKey,
					store,
				})

				const socketServices = [
					provideState(countState),
					receiveState(type(`number`), countState),
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

		await waitFor(() => jane.renderResult.getByTestId(`waiting-for-mutex`))
		await waitFor(() => jane.renderResult.getByTestId(`increment`))

		dave.renderResult.getByTestId(`0`)

		act(() => {
			dave.renderResult.getByTestId(`switch`).click()
		})

		await waitFor(() => dave.renderResult.getByTestId(`waiting-for-mutex`))

		act(() => {
			jane.renderResult.getByTestId(`switch`).click()
		})

		await waitFor(() => jane.renderResult.getByTestId(`0`))
		await waitFor(() => dave.renderResult.getByTestId(`increment`))

		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`), { timeout: 1000 })
		await teardown()
	})
})
