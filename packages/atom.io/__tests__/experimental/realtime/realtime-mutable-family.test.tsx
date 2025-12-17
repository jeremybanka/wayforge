import { waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { UList } from "atom.io/transceivers/u-list"
import { act } from "react"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined
let LOGGING: boolean
beforeEach(() => (LOGGING = true))

type CollectionName = `bar` | `foo`

const numberCollectionAtoms = AtomIO.mutableAtomFamily<
	UList<number>,
	CollectionName
>({
	key: `numbersCollection`,
	class: UList,
})
const exposedCollectionsIndex = AtomIO.atom<Set<CollectionName>>({
	key: `exposedCollectionIndex`,
	default: new Set([`foo`]),
})
const focusedCollectionNameState = AtomIO.atom<CollectionName>({
	key: `focusedCollectionState`,
	default: `foo`,
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, userKey, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					socket,
					consumer: userKey,
					store,
				})
				return exposeMutableFamily(
					numberCollectionAtoms,
					exposedCollectionsIndex,
				)
			},
			clients: {
				jane: () => {
					const name = AR.useO(focusedCollectionNameState)
					RTR.usePullMutableAtomFamilyMember(numberCollectionAtoms, name)
					const numbers = AR.useJSON(numberCollectionAtoms, name)
					return (
						<ul data-testid={name}>
							{numbers.map((n) => (
								<li data-testid={n} key={n} />
							))}
						</ul>
					)
				},
			},
		})

	test(`subscribe to available family member`, async () => {
		const { clients, server, teardown } = scenario()

		const jane = clients.jane.init()

		if (LOGGING) {
			jane.enableLogging()
		}

		jane.renderResult.getByTestId(`foo`)
		server.silo.setState(numberCollectionAtoms, `foo`, (prev) => prev.add(1))

		await waitFor(() => jane.renderResult.getByTestId(`1`))

		await teardown()
	})
	test(`subscribe to unavailable family member that becomes available`, async () => {
		const { clients, server, teardown } = scenario()

		const jane = clients.jane.init()

		if (LOGGING) {
			jane.enableLogging()
		}

		jane.renderResult.getByTestId(`foo`)
		act(() => {
			jane.silo.setState(focusedCollectionNameState, `bar`)
		})
		await waitFor(() => jane.renderResult.getByTestId(`bar`))

		await new Promise<void>((resolve) => {
			jane.socket.once(`unavailable:numbersCollection`, () => {
				resolve()
			})
		})

		server.silo.setState(exposedCollectionsIndex, (prev) => prev.add(`bar`))
		server.silo.setState(numberCollectionAtoms, `bar`, (prev) => prev.add(1))

		await waitFor(() => jane.renderResult.getByTestId(`1`))
		await teardown()
	})
})
