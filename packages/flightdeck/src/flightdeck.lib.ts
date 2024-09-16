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
	services: { [service in S]: { run: string[]; waitFor: boolean } }
	downloadPackageToUpdatesCmd: string[]
	flightdeckRootDir?: string | undefined
}

const PORT = process.env.PORT ?? 8080
const ORIGIN = `http://localhost:${PORT}`
export class FlightDeck<S extends string = string> {
	protected safety = 0

	protected webhookServer: Server
	protected services: {
		[service in S]: ChildSocket<
			{ updatesReady: [] },
			{ readyToUpdate: []; alive: [] }
		> | null
	}
	protected serviceIdx: { readonly [service in S]: number }
	public defaultServicesReadyToUpdate: { readonly [service in S]: boolean }
	public servicesReadyToUpdate: { [service in S]: boolean }
	public servicesShouldRestart: boolean

	protected logger: Pick<Console, `error` | `info` | `warn`>
	protected serviceLoggers: {
		readonly [service in S]: Pick<Console, `error` | `info` | `warn`>
	}

	public servicesLive: Future<void>[]
	public servicesDead: Future<void>[]
	public live = new Future(() => {})
	public dead = new Future(() => {})

	protected restartTimes: number[] = []

	public readonly currentServiceDir: string
	public readonly updateServiceDir: string
	public readonly backupServiceDir: string

	public constructor(public readonly options: FlightDeckOptions<S>) {
		const { secret, flightdeckRootDir = resolve(homedir(), `services`) } =
			options

		const servicesEntries = toEntries(options.services)
		this.services = fromEntries(
			servicesEntries.map(([serviceName]) => [serviceName, null]),
		)
		this.serviceIdx = fromEntries(
			servicesEntries.map(([serviceName], idx) => [serviceName, idx]),
		)
		this.defaultServicesReadyToUpdate = fromEntries(
			servicesEntries.map(([serviceName, { waitFor }]) => [
				serviceName,
				!waitFor,
			]),
		)
		this.servicesReadyToUpdate = { ...this.defaultServicesReadyToUpdate }
		this.servicesShouldRestart = true

		this.logger = {
			info: (...args: any[]) => {
				console.log(`${this.options.packageName}:`, ...args)
			},
			warn: (...args: any[]) => {
				console.warn(`${this.options.packageName}:`, ...args)
			},
			error: (...args: any[]) => {
				console.error(`${this.options.packageName}:`, ...args)
			},
		}
		this.serviceLoggers = fromEntries(
			servicesEntries.map(([serviceName]) => [
				serviceName,
				{
					info: (...args: any[]) => {
						console.log(`${this.options.packageName}::${serviceName}:`, ...args)
					},
					warn: (...args: any[]) => {
						console.warn(`${this.options.packageName}::${serviceName}:`, ...args)
					},
					error: (...args: any[]) => {
						console.error(
							`${this.options.packageName}::${serviceName}:`,
							...args,
						)
					},
				},
			]),
		)

		this.servicesLive = servicesEntries.map(() => new Future(() => {}))
		this.servicesDead = servicesEntries.map(() => new Future(() => {}))
		this.live.use(Promise.all(this.servicesLive))
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
					const authHeader = req.headers.authorization
					try {
						if (typeof req.url === `undefined`) throw 400
						if (authHeader !== `Bearer ${secret}`) throw 401
						const url = new URL(req.url, ORIGIN)
						this.logger.info(req.method, url.pathname)
						switch (req.method) {
							case `POST`:
								{
									switch (url.pathname) {
										case `/`:
											{
												res.writeHead(200)
												res.end()
												this.getLatestRelease()
												if (
													toEntries(this.servicesReadyToUpdate).every(
														([, isReady]) => isReady,
													)
												) {
													this.logger.info(`All services are ready to update!`)
													this.stopAllServices()
													return
												}
												for (const entry of toEntries(this.services)) {
													const [serviceName, service] = entry
													if (service) {
														if (this.options.services[serviceName].waitFor) {
															service.emit(`updatesReady`)
														}
													} else {
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
						this.logger.error(thrown, req.url)
						if (typeof thrown === `number`) {
							res.writeHead(thrown)
							res.end()
						}
					} finally {
						data = []
					}
				})
		}).listen(PORT, () => {
			this.logger.info(`Server started on port ${PORT}`)
		})

		this.startAllServices()
	}

	protected startAllServices(): void {
		this.logger.info(`Starting all services...`)
		for (const [serviceName] of toEntries(this.services)) {
			this.startService(serviceName)
		}
	}

	protected startService(serviceName: S): void {
		this.logger.info(
			`Starting service ${this.options.packageName}::${serviceName}, try ${this.safety}/2...`,
		)
		if (this.safety >= 2) {
			throw new Error(`Out of tries...`)
		}
		this.safety++
		if (!existsSync(this.currentServiceDir)) {
			this.logger.info(
				`Tried to start service but failed: could not find ${this.currentServiceDir}`,
			)
			this.getLatestRelease()
			this.applyUpdate()
			this.startService(serviceName)

			return
		}

		const [executable, ...args] = this.options.services[serviceName].run
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
			this.logger.info(`💬`, ...messages)
		})
		this.services[serviceName].on(`readyToUpdate`, () => {
			this.serviceLoggers[serviceName].info(`Ready to update.`)
			this.servicesReadyToUpdate[serviceName] = true
			if (
				toEntries(this.servicesReadyToUpdate).every(([, isReady]) => isReady)
			) {
				this.logger.info(`All services are ready to update.`)
				this.stopAllServices()
			}
		})
		this.services[serviceName].on(`alive`, () => {
			this.servicesLive[this.serviceIdx[serviceName]].use(Promise.resolve())
			this.servicesDead[this.serviceIdx[serviceName]] = new Future(() => {})
			if (this.dead.done) {
				this.dead = new Future(() => {})
			}
			this.dead.use(Promise.all(this.servicesDead))
		})
		this.services[serviceName].process.on(`close`, (exitCode) => {
			this.serviceLoggers[serviceName].info(`Exited with code ${exitCode}`)
			this.services[serviceName] = null
			if (!this.servicesShouldRestart) {
				this.serviceLoggers[serviceName].info(`Will not be restarted.`)
				return
			}
			const updatesAreReady = existsSync(this.updateServiceDir)
			if (updatesAreReady) {
				this.serviceLoggers[serviceName].info(`Updating before startup...`)
				this.restartTimes = []
				this.applyUpdate()
				this.startService(serviceName)
			} else {
				const now = Date.now()
				const fiveMinutesAgo = now - 5 * 60 * 1000
				this.restartTimes = this.restartTimes.filter(
					(time) => time > fiveMinutesAgo,
				)
				this.restartTimes.push(now)

				if (this.restartTimes.length < 5) {
					this.serviceLoggers[serviceName].info(`Crashed. Restarting...`)
					this.startService(serviceName)
				} else {
					this.serviceLoggers[serviceName].info(
						`Crashed 5 times in 5 minutes. Not restarting.`,
					)
				}
			}
		})
		this.safety = 0
	}

	protected applyUpdate(): void {
		this.logger.info(`Applying update...`)
		if (existsSync(this.updateServiceDir)) {
			const runningServices = toEntries(this.services).filter(
				([, service]) => service,
			)
			if (runningServices.length > 0) {
				this.logger.error(
					`Tried to apply update but failed. The following services are currently running: [${runningServices.map(([serviceName]) => serviceName).join(`, `)}]`,
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
			this.servicesReadyToUpdate = { ...this.defaultServicesReadyToUpdate }
		} else {
			this.logger.error(
				`Tried to apply update but failed: could not find update directory ${this.updateServiceDir}`,
			)
		}
	}

	protected getLatestRelease(): void {
		this.logger.info(`Getting latest release...`)

		try {
			execSync(this.options.downloadPackageToUpdatesCmd.join(` `))
		} catch (thrown) {
			if (thrown instanceof Error) {
				this.logger.error(`Failed to get the latest release: ${thrown.message}`)
			}
			return
		}
	}

	public stopAllServices(): void {
		this.logger.info(`Stopping all services...`)
		for (const [serviceName] of toEntries(this.services)) {
			this.stopService(serviceName)
		}
	}

	public stopService(serviceName: S): void {
		if (this.services[serviceName]) {
			this.serviceLoggers[serviceName].info(`Stopping service...`)
			this.services[serviceName].process.kill()
			this.services[serviceName] = null
			this.servicesDead[this.serviceIdx[serviceName]].use(Promise.resolve())
			this.servicesLive[this.serviceIdx[serviceName]] = new Future(() => {})
			if (this.live.done) {
				this.live = new Future(() => {})
			}
			this.live.use(Promise.all(this.servicesLive))
		} else {
			this.serviceLoggers[serviceName].error(
				`Tried to stop service, but it wasn't running.`,
			)
		}
	}

	public shutdown(): void {
		this.servicesShouldRestart = false
		this.stopAllServices()
	}
}
