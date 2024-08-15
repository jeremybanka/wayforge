import { act } from "@testing-library/react"
import { findInStore, getFromStore } from "atom.io/internal"
import { roomSelectors } from "atom.io/realtime-server"
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
	const scenario = (port: number) => {
		const { server, client, teardown } = RTTest.singleClient({
			port,
			server: SystemServer,
			client: BrowserGame,
		})

		return { client, server, teardown }
	}

	it(`cleans up rooms that were left open on teardown`, async () => {
		const { client, server, teardown } = scenario(6360)
		const app = client.init()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		await app.renderResult.findByTestId(`join-room-1`)

		const roomSocketState = findInStore(
			server.silo.store,
			roomSelectors,
			`room-1`,
		)
		const roomSocket = await getFromStore(server.silo.store, roomSocketState)

		teardown()

		expect(roomSocket.process.killed).toBe(true)
	})
	it(`permits manual creation and deletion of rooms`, async () => {
		const { client, teardown } = scenario(6361)
		const app = client.init()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		const deleteRoomButton = await app.renderResult.findByTestId(`delete-room-1`)
		act(() => {
			deleteRoomButton.click()
		})
		await app.renderResult.findByTestId(`no-rooms`)

		teardown()
	})
	it(`permits join and leave`, async () => {
		const { client, teardown } = scenario(6362)
		const app = client.init()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		const joinRoomButton = await app.renderResult.findByTestId(`join-room-1`)
		act(() => {
			joinRoomButton.click()
		})
		await app.renderResult.findByTestId(`room-1`)
		await app.renderResult.findByTestId(`A`, undefined, { timeout: 3000 })
		const leaveRoomButton = await app.renderResult.findByTestId(`leave-room`)
		act(() => {
			leaveRoomButton.click()
		})
		await app.renderResult.findByTestId(`create-room`)

		teardown()
	})
})
