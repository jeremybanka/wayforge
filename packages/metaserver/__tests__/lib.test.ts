import { execSync } from "node:child_process"
import type { IncomingHttpHeaders, IncomingHttpStatusHeader } from "node:http2"
import { connect } from "node:http2"
import { resolve } from "node:path"

import tmp from "tmp"

import { ServiceManager } from "../src/lib"

const testDirname = import.meta.dirname

let serviceManager: ServiceManager
let tmpDir: tmp.DirResult

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `log`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

afterEach(() => {
	serviceManager.stopService()
})

describe(`ServiceManager`, () => {
	it(`should start a service`, async () => {
		let version = 0
		serviceManager = new ServiceManager(
			`secret`,
			`sample/repo`,
			`my-app`,
			[`./app`],
			tmpDir.name,
			function fetchLatestRelease(destination) {
				console.log(`fetching latest release`)
				execSync(
					`bun build ${testDirname}/fixtures/app@v${version}.ts --bundle --outfile ${resolve(destination, `app`)}`,
				)
				version++
			},
		)
		await serviceManager.alive
		const data = await fetch(`http://localhost:4444/`)
		console.log(await data.text())

		const client = connect(`http://localhost:8080/`)

		const req = client.request({
			":method": `POST`,
			":path": `/`,
			authorization: `Bearer secret`,
		})

		const response = await new Promise<{
			headers: IncomingHttpHeaders & IncomingHttpStatusHeader
			flags: number
		}>((pass) => {
			req.on(`response`, (headers, flags) => {
				console.log(headers)
				pass({ headers, flags })
			})
			req.on(`error`, pass)
			req.end()
		})
		console.log(response)
		expect(response.headers[`:status`]).toBe(200)

		await serviceManager.dead
		await serviceManager.alive
	}, 5000)
})
