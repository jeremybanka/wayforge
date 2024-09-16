import { execSync, spawn } from "node:child_process"
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs"
import type { Server } from "node:http"
import { createServer } from "node:http"
import { homedir } from "node:os"
import { resolve } from "node:path"

import { Future } from "atom.io/internal"
import { fromEntries, toEntries } from "atom.io/json"
import { ChildSocket } from "atom.io/realtime-server"

export type FlightDeckOptions<S extends string = string> = {
	secret: string
	packageName: string
	executables: { [service in S]: string[] }
	downloadPackageToUpdatesCmd: string[]
	flightdeckRootDir?: string | undefined
}

const PORT = process.env.PORT ?? 8080
const ORIGIN = `http://localhost:${PORT}`
export class FlightDeck<S extends string = string> {
	protected safety = -3

	protected webhookServer: Server
	protected services: {
		[service in S]: ChildSocket<
			{ updatesReady: [] },
			{ readyToUpdate: []; alive: [] }
		> | null
	}
	protected serviceIdx: { readonly [service in S]: number }

	protected restartTimes: number[] = []

	public servicesAlive: Future<void>[]
	public servicesDead: Future<void>[]
	public alive = new Future(() => {})
	public dead = new Future(() => {})

	public readonly currentServiceDir: string
	public readonly updateServiceDir: string
	public readonly backupServiceDir: string

	public constructor(public readonly options: FlightDeckOptions<S>) {
		const { secret, flightdeckRootDir = resolve(homedir(), `services`) } =
			options

		this.services = fromEntries(
			toEntries(options.executables).map(([serviceName]) => [serviceName, null]),
		)
		this.serviceIdx = fromEntries(
			toEntries(options.executables).map(([serviceName], idx) => [
				serviceName,
				idx,
			]),
		)
		this.servicesAlive = toEntries(this.services).map(() => new Future(() => {}))
		this.servicesDead = toEntries(this.services).map(() => new Future(() => {}))
		this.alive.use(Promise.all(this.servicesAlive))
		this.dead.use(Promise.all(this.servicesDead))

		this.currentServiceDir = resolve(
			flightdeckRootDir,
			options.packageName,
			`current`,
		)
		this.backupServiceDir = resolve(
			flightdeckRootDir,
			options.packageName,
			`backup`,
		)
		this.updateServiceDir = resolve(
			flightdeckRootDir,
			options.packageName,
			`update`,
		)

		createServer((req, res) => {
			let data: Uint8Array[] = []
			req
				.on(`data`, (chunk) => {
					data.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
				})
				.on(`end`, () => {
					console.log(req.headers)
					const authHeader = req.headers.authorization
					try {
						if (typeof req.url === `undefined`) throw 400
						if (authHeader !== `Bearer ${secret}`) throw 401
						const url = new URL(req.url, ORIGIN)
						console.log(req.method, url.pathname)
						switch (req.method) {
							case `POST`:
								{
									console.log(`received post, url is ${url.pathname}`)
									switch (url.pathname) {
										case `/`:
											{
												res.writeHead(200)
												res.end()
												this.fetchLatestRelease()
												for (const entry of toEntries(this.services)) {
													const [serviceName, service] = entry
													if (service) {
														service.emit(`updatesReady`)
													} else {
														this.applyUpdate()
														this.startService(serviceName)
													}
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

		this.startAllServices()
	}

	protected startAllServices(): void {
		for (const [serviceName] of toEntries(this.services)) {
			this.startService(serviceName)
		}
	}

	protected startService(serviceName: S): void {
		this.safety++
		console.log(`safety is ${this.safety}`)
		if (this.safety >= 0) {
			throw new Error(`safety exceeded`)
		}
		if (!existsSync(this.currentServiceDir)) {
			console.log(
				`Tried to start service but failed: Service ${this.options.packageName} is not yet installed.`,
			)
			this.fetchLatestRelease()
			this.applyUpdate()
			this.startService(serviceName)

			return
		}

		const [executable, ...args] = this.options.executables[serviceName]
		const program = executable.startsWith(`./`)
			? resolve(this.currentServiceDir, executable)
			: executable
		const serviceProcess = spawn(program, args, {
			cwd: this.currentServiceDir,
			env: import.meta.env,
		})
		this.services[serviceName] = new ChildSocket(
			serviceProcess,
			`${this.options.packageName}::${serviceName}`,
			console,
		)
		this.services[serviceName].onAny((...messages) => {
			console.log(`${this.options.packageName}::${serviceName} 💬`, ...messages)
		})
		this.services[serviceName].on(`readyToUpdate`, () => {
			this.stopService(serviceName)
		})
		this.services[serviceName].on(`alive`, () => {
			this.servicesAlive[this.serviceIdx[serviceName]].use(Promise.resolve())
			this.servicesDead[this.serviceIdx[serviceName]] = new Future(() => {})
			if (this.dead.done) {
				this.dead = new Future(() => {})
			}
			this.dead.use(Promise.all(this.servicesDead))
		})
		this.services[serviceName].process.on(`close`, (exitCode) => {
			console.log(
				`${this.options.packageName}::${serviceName} exited with code ${exitCode}`,
			)
			this.services[serviceName] = null
			const updatesAreReady = existsSync(this.updateServiceDir)
			if (updatesAreReady) {
				console.log(
					`${this.options.packageName}::${serviceName} will be updated before startup...`,
				)
				this.restartTimes = []
				this.applyUpdate()
				this.startService(serviceName)
			} else {
				if (exitCode !== 0) {
					const now = Date.now()
					const fiveMinutesAgo = now - 5 * 60 * 1000
					this.restartTimes = this.restartTimes.filter(
						(time) => time > fiveMinutesAgo,
					)
					this.restartTimes.push(now)

					if (this.restartTimes.length < 5) {
						console.log(
							`Service ${this.options.packageName}::${serviceName} crashed. Restarting...`,
						)
						this.startService(serviceName)
					} else {
						console.log(
							`Service ${this.options.packageName}::${serviceName} crashed too many times. Not restarting.`,
						)
					}
				}
			}
		})
		this.safety = -3
	}

	protected applyUpdate(): void {
		console.log(
			`Installing latest version of service ${this.options.packageName}...`,
		)

		if (existsSync(this.updateServiceDir)) {
			const runningServices = toEntries(this.services).filter(
				([, service]) => service,
			)
			if (runningServices.length > 0) {
				console.log(
					`Tried to apply update to ${this.options.packageName} but failed. The following services are currently running: [${runningServices.map(([serviceName]) => serviceName).join(`, `)}]`,
				)
				return
			}

			if (existsSync(this.currentServiceDir)) {
				if (!existsSync(this.backupServiceDir)) {
					mkdirSync(this.backupServiceDir, { recursive: true })
				} else {
					rmSync(this.backupServiceDir, { recursive: true })
				}
				renameSync(this.currentServiceDir, this.backupServiceDir)
			}

			renameSync(this.updateServiceDir, this.currentServiceDir)
			this.restartTimes = []
		} else {
			console.log(`Service ${this.options.packageName} is already up to date.`)
		}
	}

	protected fetchLatestRelease(): void {
		console.log(
			`Downloading latest version of service ${this.options.packageName}...`,
		)

		try {
			execSync(this.options.downloadPackageToUpdatesCmd.join(` `))
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(`Failed to fetch the latest release: ${thrown.message}`)
			}
			return
		}
	}

	public stopAllServices(): void {
		for (const [serviceName] of toEntries(this.services)) {
			this.stopService(serviceName)
		}
	}

	public stopService(serviceName: S): void {
		if (this.services[serviceName]) {
			console.log(
				`Stopping service ${this.options.packageName}::${serviceName}...`,
			)
			this.services[serviceName].process.kill()
			this.services[serviceName] = null
			this.servicesDead[this.serviceIdx[serviceName]].use(Promise.resolve())
			this.servicesAlive[this.serviceIdx[serviceName]] = new Future(() => {})
			if (this.alive.done) {
				this.alive = new Future(() => {})
			}
			this.alive.use(Promise.all(this.servicesAlive))
		} else {
			console.error(
				`Failed to stop service ${this.options.packageName}::${serviceName}: Service is not running.`,
			)
		}
	}
}
