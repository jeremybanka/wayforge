import { waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
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

const globalMultipliersEnabledAtom = AtomIO.atom<boolean>({
	key: `globalMultipliersEnabled`,
	default: false,
})
const globalMultipliersAtom = AtomIO.mutableAtom<UList<number>>({
	key: `globalMultiplier`,
	class: UList,
})
const countAtoms = AtomIO.atomFamily<number, `count:${number}`>({
	key: `count`,
	default: 0,
})
const countGroupsAtoms = AtomIO.mutableAtomFamily<
	UList<`count:${number}`>,
	`cluster:${number}`
>({
	key: `countGroup`,
	class: UList,
})
const countsExposedAtoms = AtomIO.atom<`count:${number}`[]>({
	key: `countsExposed`,
	default: [`count:0`, `count:1`, `count:2`],
})
const countsGroupsExposedAtom = AtomIO.mutableAtom<UList<`cluster:${number}`>>({
	key: `countsGroupsExposed`,
	class: UList,
})
const computationSelectors = AtomIO.selectorFamily<number, `cluster:${number}`>({
	key: `computation`,
	get:
		(key) =>
		({ get }) => {
			const group = get(countGroupsAtoms, key)
			let sum = 0
			for (const count of group) {
				sum += get(countAtoms, count)
			}
			const multiplierEnabled = get(globalMultipliersEnabledAtom)
			if (multiplierEnabled) {
				const factors = get(globalMultipliersAtom)
				let product = sum
				for (const factor of factors) {
					product *= factor
				}
				return product
			}
			return sum
		},
})

describe(`pull atom, observe selector`, () => {
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, userKey, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const exposeSingle = RTS.realtimeStateProvider({
					socket,
					userKey,
					store,
				})
				const exposeMutable = RTS.realtimeMutableProvider({
					userKey,
					socket,
					store,
				})
				const exposeFamily = RTS.realtimeAtomFamilyProvider({
					socket,
					userKey,
					store,
				})
				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					userKey,
					socket,
					store,
				})
				const subscriptions = [
					exposeSingle(globalMultipliersEnabledAtom),
					exposeMutable(globalMultipliersAtom),
					exposeFamily(countAtoms, countsExposedAtoms),
					exposeMutableFamily(countGroupsAtoms, countsGroupsExposedAtom),
				]
				return () => {
					for (const unsub of subscriptions) unsub()
				}
			},
			client: () => {
				const computation = RTR.usePullSelectorFamilyMember(
					computationSelectors,
					`cluster:1`,
				)
				return <i data-testid={`computation:${computation}`} />
			},
		})

	test(`receive atomic update; derive selector update`, async () => {
		const { client: uninitializedClient, server, teardown } = scenario()

		const client = uninitializedClient.init()

		if (LOGGING) {
			client.enableLogging()
		}

		client.renderResult.getByTestId(`computation:0`)

		await new Promise<void>((resolve) => {
			client.socket.once(`unavailable:countGroup`, () => {
				resolve()
			})
		})

		server.silo.setState(countsGroupsExposedAtom, (prev) =>
			prev.add(`cluster:1`),
		)

		// await waitFor(() => client.renderResult.getByTes tId(`computation:1`))

		await new Promise<void>((resolve) => {
			client.socket.once(`init:countGroup("cluster:1")`, () => {
				resolve()
			})
		})

		server.silo.setState(countAtoms, `count:1`, 3)
		server.silo.setState(countGroupsAtoms, `cluster:1`, (prev) =>
			prev.add(`count:1`),
		)

		await waitFor(() => client.renderResult.getByTestId(`computation:3`))

		server.silo.setState(globalMultipliersAtom, (prev) => prev.add(2))
		server.silo.setState(globalMultipliersEnabledAtom, true)

		await waitFor(() => client.renderResult.getByTestId(`computation:6`))

		server.silo.setState(globalMultipliersEnabledAtom, false)
		await waitFor(() => client.renderResult.getByTestId(`computation:3`))

		await teardown()
	})
})
