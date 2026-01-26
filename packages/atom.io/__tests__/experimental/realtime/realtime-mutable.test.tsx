import { waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { UList } from "atom.io/transceivers/u-list"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined
let LOGGING: boolean
beforeEach(() => (LOGGING = true))

const numbersCollectionAtom = AtomIO.mutableAtom<UList<number>>({
	key: `numbersCollection`,
	class: UList,
	effects: [
		({ setSelf }) => {
			setSelf((prev) => prev.add(0))
		},
	],
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, userKey, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const exposeMutable = RTS.realtimeMutableProvider({
					socket,
					consumer: userKey,
					store,
				})
				return exposeMutable(numbersCollectionAtom)
			},
			clients: {
				jane: () => {
					RTR.usePullMutable(numbersCollectionAtom)
					const numbers = AR.useJSON(numbersCollectionAtom)
					return (
						<>
							{numbers.map((n) => (
								<i data-testid={n} key={n} />
							))}
						</>
					)
				},
			},
		})

	test(`pull updates`, async () => {
		const { server, clients, teardown } = scenario()

		const jane = clients.jane.init()

		if (LOGGING) {
			jane.enableLogging()
		}

		jane.renderResult.getByTestId(`0`)

		server.silo.setState(numbersCollectionAtom, (prev) => prev.add(1))

		await waitFor(() => {
			jane.renderResult.getByTestId(`1`)
		})
		await teardown()
	})
})
