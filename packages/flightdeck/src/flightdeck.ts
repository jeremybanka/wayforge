import { execSync, spawn } from "node:child_process"
import { existsSync, mkdirSync, renameSync } from "node:fs"
import type { Http2Server } from "node:http2"
import { createServer } from "node:http2"
import { homedir } from "node:os"
import { resolve } from "node:path"

import { Future } from "atom.io/internal"
import { ChildSocket } from "atom.io/realtime-server"

export type FlightDeckOptions = {
	secret: string
	repo: string
	app: string
	runCmd: string[]
	serviceDir?: string
	mockRetrieveService?: (destination: string) => Promise<void> | void
}

let safety = 0
const PORT = process.env.PORT ?? 8080
const ORIGIN = `http://localhost:${PORT}`
export class FlightDeck {
	public get serviceName(): string {
		return `${this.repo}/${this.app}`
	}

	protected webhookServer: Http2Server
	protected service: ChildSocket<
		{ updatesReady: [] },
		{ readyToUpdate: []; alive: [] }
	> | null = null
	protected restartTimes: number[] = []

	public alive = new Future(() => {})
	public dead = new Future(() => {})

	public readonly currentServiceDir: string
	public readonly updateServiceDir: string
	public readonly backupServiceDir: string

	public constructor(
		public readonly secret: string,
		public readonly repo: string,
		public readonly app: string,
		public readonly runCmd: string[],
		public readonly serviceDir: string = resolve(
			homedir(),
			`services`,
			this.repo,
			this.app,
			`current`,
		),
		public readonly mockRetrieveService?: (
			destination: string,
		) => Promise<void> | void,
	) {
		this.currentServiceDir = resolve(this.serviceDir, `current`)
		this.backupServiceDir = resolve(this.serviceDir, `backup`)
		this.updateServiceDir = resolve(this.serviceDir, `update`)

		createServer((req, res) => {
			let data: Uint8Array[] = []
			req
				.on(`data`, (chunk) => {
					data.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
				})
				.on(`end`, async () => {
					console.log(req.headers)
					const authHeader = req.headers.authorization
					try {
						if (authHeader !== `Bearer ${secret}`) throw 401
						const url = new URL(req.url, ORIGIN)
						console.log(req.method, url.pathname)
						switch (req.method) {
							case `POST`:
								{
									console.log(`received post, url is ${url.pathname}`)
									// const text = Buffer.concat(data).toString()
									// const json: Json.Serializable = JSON.parse(text)
									// console.log({ json, url })
									switch (url.pathname) {
										case `/`:
											{
												res.writeHead(200)
												res.end()
												await this.fetchLatestRelease()
												if (this.service) {
													this.service.emit(`updatesReady`)
												} else {
													this.applyUpdate()
													this.startService()
												}
											}
											break

										default:
											throw 404
									}
								}
								break

							default:
								throw 405
						}
					} catch (thrown) {
						console.error(thrown, req.url)
						if (typeof thrown === `number`) {
							res.writeHead(thrown)
							res.end()
						}
					} finally {
						data = []
					}
				})
		}).listen(PORT, () => {
			console.log(`Server started on port ${PORT}`)
		})

		this.startService()
	}

	protected startService(): void {
		safety++
		if (safety > 10) {
			throw new Error(`safety exceeded`)
		}
		if (!existsSync(this.currentServiceDir)) {
			console.log(
				`Tried to start service but failed: Service ${this.serviceName} is not yet installed.`,
			)
			void this.fetchLatestRelease().then(() => {
				this.applyUpdate()
				this.startService()
			})
			return
		}

		const [executable, ...args] = this.runCmd
		const program = executable.startsWith(`./`)
			? resolve(this.currentServiceDir, executable)
			: executable
		const serviceProcess = spawn(program, args, {
			cwd: this.currentServiceDir,
			env: import.meta.env,
		})
		this.service = new ChildSocket(serviceProcess, this.serviceName, console)
		this.service.onAny((...messages) => {
			console.log(`🛰 `, ...messages)
		})
		this.service.on(`readyToUpdate`, () => {
			this.stopService()
		})
		this.service.on(`alive`, () => {
			this.alive.use(Promise.resolve())
			this.dead = new Future(() => {})
		})
		this.service.process.on(`close`, (exitCode) => {
			console.log(`Service ${this.serviceName} exited with code ${exitCode}`)
			this.service = null
			const updatesAreReady = existsSync(this.updateServiceDir)
			if (updatesAreReady) {
				console.log(`Updates are ready; applying and restarting...`)
				this.restartTimes = []
				this.applyUpdate()
				this.startService()
			} else {
				if (exitCode !== 0) {
					const now = Date.now()
					const fiveMinutesAgo = now - 5 * 60 * 1000
					this.restartTimes = this.restartTimes.filter(
						(time) => time > fiveMinutesAgo,
					)
					this.restartTimes.push(now)

					if (this.restartTimes.length < 5) {
						console.log(`Service ${this.serviceName} crashed. Restarting...`)
						this.startService()
					} else {
						console.log(
							`Service ${this.serviceName} crashed too many times. Not restarting.`,
						)
					}
				}
			}
		})
	}

	protected applyUpdate(): void {
		console.log(`Installing latest version of service ${this.serviceName}...`)

		if (existsSync(this.updateServiceDir)) {
			if (this.service) {
				console.log(
					`Tried to apply update but failed: Service ${this.serviceName} is currently running.`,
				)
				return
			}

			if (existsSync(this.currentServiceDir)) {
				if (!existsSync(this.backupServiceDir)) {
					mkdirSync(this.backupServiceDir, { recursive: true })
				}
				renameSync(this.currentServiceDir, this.backupServiceDir)
			}

			renameSync(this.updateServiceDir, this.currentServiceDir)
			this.restartTimes = []
		} else {
			console.log(`Service ${this.serviceName} is already up to date.`)
		}
	}

	protected async fetchLatestRelease(): Promise<void> {
		console.log(`Downloading latest version of service ${this.serviceName}...`)

		if (this.mockRetrieveService) {
			await this.mockRetrieveService(this.updateServiceDir)
			return
		}
		try {
			const assetUrl = execSync(
				`gh release view --repo ${this.repo} --json tagName,assets --jq '.assets[] | select(.name | test("${this.app}")) | .url'`,
			)
			if (!assetUrl) {
				console.log(`No matching release found for ${this.serviceName}.`)
				return
			}

			if (!existsSync(this.currentServiceDir)) {
				mkdirSync(this.currentServiceDir, { recursive: true })
			}

			console.log(`Downloading release for ${this.serviceName}...`)

			execSync(
				`gh release download --repo ${this.repo} --dir ${this.currentServiceDir} --pattern "*${this.app}*"`,
			)

			return
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(`Failed to fetch the latest release: ${thrown.message}`)
			}
			return
		}
	}

	public stopService(): void {
		if (this.service) {
			console.log(`Stopping service ${this.serviceName}...`)
			this.service.process.kill()
			this.service = null
			this.dead.use(Promise.resolve())
			this.alive = new Future(() => {})
		} else {
			console.error(
				`Failed to stop service ${this.serviceName}: Service is not running.`,
			)
		}
	}
}
