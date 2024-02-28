import { act } from "@testing-library/react"
import * as RTTest from "atom.io/realtime-testing"
import { BrowserGame } from "./BrowserGame"
import { DatabaseManager } from "./database.node"
import { SystemServer } from "./system-server.node"

const dbManager = new DatabaseManager()

beforeAll(async () => {
	await dbManager.createDatabase()
})

beforeEach(async () => {
	console.log(`Creating sample tables`)
	await dbManager.createSampleTables()
	await dbManager.insertSampleData()
	await dbManager.setupTriggersAndNotifications()
})

afterEach(async () => {
	await dbManager.dropSampleTables()
})

afterAll(async () => {
	await dbManager.dropDatabase()
})

describe(`multi-process realtime server`, () => {
	const scenario = () => {
		const { server, client, teardown } = RTTest.singleClient({
			port: 5678,
			server: SystemServer,
			client: BrowserGame,
		})

		return { client, server, teardown }
	}

	it(`runs several instances of the same server`, async () => {
		const { client, teardown } = scenario()
		const app = client.init()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => createRoomButton.click())
		const joinRoomButton = await app.renderResult.findByTestId(`join-room-1`)
		act(() => joinRoomButton.click())
		await app.renderResult.findByTestId(`room-1`)
		await app.renderResult.findByTestId(`A`, undefined, { timeout: 3000 })

		teardown()
	})
})
