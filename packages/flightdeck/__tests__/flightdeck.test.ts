import { resolve } from "node:path"

import tmp from "tmp"

import { FlightDeck, Klaxon } from "../src/lib"

const testDirname = import.meta.dirname

let flightDeck: FlightDeck
let tmpDir: tmp.DirResult

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `log`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

afterEach(async () => {
	flightDeck.shutdown()
	await flightDeck.dead
})

describe(`FlightDeck`, () => {
	it(`should start a service and keep it up to date`, async () => {
		let version = 0
		flightDeck = new FlightDeck({
			secret: `secret`,
			packageName: `my-app`,
			services: {
				frontend: { run: [`./frontend`, `7777`], waitFor: false },
				backend: { run: [`./backend`, `8888`], waitFor: true },
			},
			flightdeckRootDir: tmpDir.name,
			get downloadPackageToUpdatesCmd() {
				return [
					`bun`,
					`build`,
					`${testDirname}/fixtures/app@v${version}.ts`,
					`--bundle`,
					`--outfile`,
					`${resolve(tmpDir.name, `my-app`, `update`, `frontend`)}`,
					`&&`,
					`bun`,
					`build`,
					`${testDirname}/fixtures/app@v${version}.ts`,
					`--bundle`,
					`--outfile`,
					`${resolve(tmpDir.name, `my-app`, `update`, `backend`)}`,
				]
			},
		})
		await flightDeck.live
		const [res0, res1] = await Promise.all([
			fetch(`http://localhost:7777/`),
			fetch(`http://localhost:8888/`),
		])
		const [data0, data1] = await Promise.all([res0.text(), res1.text()])
		expect(data0).toEqual(`Hello World!`)
		expect(data1).toEqual(`Hello World!`)

		version++
		const response = await Klaxon.alert({
			secret: `secret`,
			endpoint: `http://localhost:8080/`,
		})

		expect(response.status).toBe(200)

		await flightDeck.dead
		console.log(`👷 flightdeck: all services are dead`)

		await flightDeck.live
		console.log(`👷 flightdeck: all services are live`)

		const [res2, res3] = await Promise.all([
			fetch(`http://localhost:7777/`),
			fetch(`http://localhost:8888/`),
		])

		const [data2, data3] = await Promise.all([res2.text(), res3.text()])
		expect(data2).toEqual(`I can see my house from here!`)
		expect(data3).toEqual(`I can see my house from here!`)
	}, 5000)
})
