import { execSync, spawn } from "node:child_process"
import type { Server } from "node:http"
import { createServer } from "node:http"
import { homedir } from "node:os"
import { resolve } from "node:path"

import { Future } from "atom.io/internal"
import { discoverType } from "atom.io/introspection"
import { fromEntries, toEntries } from "atom.io/json"
import { ChildSocket } from "atom.io/realtime-server"
import { CronJob } from "cron"

import { FilesystemStorage } from "./filesystem-storage"
import { env } from "./flightdeck.env"

export const FLIGHTDECK_SETUP_PHASES = [`downloaded`, `installed`] as const

export type FlightDeckSetupPhase = (typeof FLIGHTDECK_SETUP_PHASES)[number]

export const FLIGHTDECK_UPDATE_PHASES = [`notified`, `confirmed`] as const

export type FlightDeckUpdatePhase = (typeof FLIGHTDECK_UPDATE_PHASES)[number]

export function isVersionNumber(version: string): boolean {
	return (
		/^\d+\.\d+\.\d+$/.test(version) || !Number.isNaN(Number.parseFloat(version))
	)
}

export type FlightDeckOptions<S extends string = string> = {
	packageName: string
	services: { [service in S]: { run: string; waitFor: boolean } }
	scripts: {
		download: string
		install: string
		checkAvailability?: string
	}
	port?: number | undefined
	flightdeckRootDir?: string | undefined
}

export class FlightDeck<S extends string = string> {
	protected safety = 0

	protected storage: FilesystemStorage<{
		setupPhase: FlightDeckSetupPhase
		updatePhase: FlightDeckUpdatePhase
		updateAwaitedVersion: string
	}>
	protected webhookServer: Server
	protected services: {
		[service in S]: ChildSocket<
			{ timeToStop: []; updatesReady: [] },
			{ readyToUpdate: []; alive: [] }
		> | null
	}
	protected serviceIdx: { readonly [service in S]: number }
	public defaultServicesReadyToUpdate: { readonly [service in S]: boolean }
	public servicesReadyToUpdate: { [service in S]: boolean }
	public autoRespawnDeadServices: boolean

	protected logger: Pick<Console, `error` | `info` | `warn`>
	protected serviceLoggers: {
		readonly [service in S]: Pick<Console, `error` | `info` | `warn`>
	}

	protected updateAvailabilityChecker: CronJob | null = null

	public servicesLive: Future<void>[]
	public servicesDead: Future<void>[]
	public live = new Future(() => {})
	public dead = new Future(() => {})

	protected restartTimes: number[] = []

	public constructor(public readonly options: FlightDeckOptions<S>) {
		const { FLIGHTDECK_SECRET } = env
		const { flightdeckRootDir = resolve(homedir(), `.flightdeck`) } = options
		const port = options.port ?? 8080
		const origin = `http://localhost:${port}`

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
		this.autoRespawnDeadServices = true

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

		this.storage = new FilesystemStorage({
			path: resolve(flightdeckRootDir, `storage`, options.packageName),
		})

		if (FLIGHTDECK_SECRET === undefined) {
			this.logger.warn(
				`No FLIGHTDECK_SECRET environment variable found. FlightDeck will not run an update server.`,
			)
		} else {
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
							const expectedAuthHeader = `Bearer ${FLIGHTDECK_SECRET}`
							if (authHeader !== `Bearer ${FLIGHTDECK_SECRET}`) {
								this.logger.info(
									`Unauthorized: needed \`${expectedAuthHeader}\`, got \`${authHeader}\``,
								)
								throw 401
							}
							const url = new URL(req.url, origin)
							this.logger.info(req.method, url.pathname)

							const versionForeignInput = Buffer.concat(data).toString()
							if (!isVersionNumber(versionForeignInput)) {
								throw 400
							}

							res.writeHead(200)
							res.end()

							this.storage.setItem(`updatePhase`, `notified`)
							this.storage.setItem(`updateAwaitedVersion`, versionForeignInput)
							const { checkAvailability } = options.scripts
							if (checkAvailability) {
								this.updateAvailabilityChecker?.stop()
								this.seekUpdate(versionForeignInput)
								const updatePhase = this.storage.getItem(`updatePhase`)
								this.logger.info(`> storage("updatePhase") >`, updatePhase)
								if (updatePhase === `notified`) {
									this.updateAvailabilityChecker = new CronJob(
										`30 * * * * *`,
										() => {
											this.seekUpdate(versionForeignInput)
										},
									)
									this.updateAvailabilityChecker.start()
								}
							} else {
								this.downloadPackage()
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
			}).listen(port, () => {
				this.logger.info(`Server started on port ${port}`)
			})
		}

		this.startAllServices()
			.then(() => {
				this.logger.info(`All services started.`)
			})
			.catch((thrown) => {
				if (thrown instanceof Error) {
					this.logger.error(`Failed to start all services:`, thrown.message)
				}
			})
	}

	protected seekUpdate(version: string): void {
		this.logger.info(`Checking for updates...`)
		const { checkAvailability } = this.options.scripts
		if (!checkAvailability) {
			this.logger.info(`No checkAvailability script found.`)
			return
		}
		try {
			const out = execSync(`${checkAvailability} ${version}`)
			this.logger.info(`Check stdout:`, out.toString())
			this.updateAvailabilityChecker?.stop()
			this.storage.setItem(`updatePhase`, `confirmed`)
			this.downloadPackage()
			this.announceUpdate()
		} catch (thrown) {
			if (thrown instanceof Error) {
				this.logger.error(`Check failed:`, thrown.message)
			} else {
				const thrownType = discoverType(thrown)
				this.logger.error(`Check threw`, thrownType, thrown)
			}
		}
	}

	protected announceUpdate(): void {
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

	protected tryUpdate(): void {
		if (toEntries(this.servicesReadyToUpdate).every(([, isReady]) => isReady)) {
			this.logger.info(`All services are ready to update.`)
			this.stopAllServices()
				.then(() => {
					this.logger.info(`All services stopped; starting up fresh...`)
					this.startAllServices()
						.then(() => {
							this.logger.info(`All services started; we're back online.`)
						})
						.catch((thrown) => {
							if (thrown instanceof Error) {
								this.logger.error(
									`Failed to start all services:`,
									thrown.message,
								)
							}
						})
				})
				.catch((thrown) => {
					if (thrown instanceof Error) {
						this.logger.error(`Failed to stop all services:`, thrown.message)
					}
				})
		}
	}

	protected startAllServices(): Future<unknown> {
		this.logger.info(`Starting all services...`)
		this.autoRespawnDeadServices = true
		const setupPhase = this.storage.getItem(`setupPhase`)
		this.logger.info(`> storage("setupPhase") >`, setupPhase)
		switch (setupPhase) {
			case null:
				this.logger.info(`Starting from scratch.`)
				this.downloadPackage()
				this.installPackage()
				return this.startAllServices()
			case `downloaded`:
				this.logger.info(`Found package downloaded but not installed.`)
				this.installPackage()
				return this.startAllServices()
			case `installed`: {
				for (const [serviceName] of toEntries(this.services)) {
					this.startService(serviceName)
				}
				return this.live
			}
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

		const [exe, ...args] = this.options.services[serviceName].run.split(` `)
		const serviceProcess = spawn(exe, args, {
			cwd: this.options.flightdeckRootDir,
			env: import.meta.env,
		})
		this.services[serviceName] = new ChildSocket(
			serviceProcess,
			`${this.options.packageName}::${serviceName}`,
			console,
		)
		this.services[serviceName].onAny((...messages) => {
			this.serviceLoggers[serviceName].info(`💬`, ...messages)
		})
		this.services[serviceName].on(`readyToUpdate`, () => {
			this.logger.info(`Service "${serviceName}" is ready to update.`)
			this.servicesReadyToUpdate[serviceName] = true
			this.tryUpdate()
		})
		this.services[serviceName].on(`alive`, () => {
			this.servicesLive[this.serviceIdx[serviceName]].use(Promise.resolve())
			this.servicesDead[this.serviceIdx[serviceName]] = new Future(() => {})
			if (this.dead.done) {
				this.dead = new Future(() => {})
			}
			this.dead.use(Promise.all(this.servicesDead))
		})
		this.services[serviceName].process.once(`close`, (exitCode) => {
			this.logger.info(
				`Auto-respawn saw "${serviceName}" exit with code ${exitCode}`,
			)
			this.services[serviceName] = null
			if (!this.autoRespawnDeadServices) {
				this.logger.info(`Auto-respawn is off; "${serviceName}" rests.`)
				return
			}
			const updatePhase = this.storage.getItem(`updatePhase`)
			this.logger.info(`> storage("updatePhase") >`, updatePhase)
			const updatesAreReady = updatePhase === `confirmed`
			if (updatesAreReady) {
				this.serviceLoggers[serviceName].info(`Updating before startup...`)
				this.restartTimes = []
				this.installPackage()
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

	protected downloadPackage(): void {
		this.logger.info(`Downloading...`)
		try {
			const out = execSync(this.options.scripts.download)
			this.logger.info(`Download stdout:`, out.toString())
			this.storage.setItem(`setupPhase`, `downloaded`)
			this.logger.info(`Downloaded!`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				this.logger.error(`Failed to get the latest release: ${thrown.message}`)
			}
			return
		}
	}

	protected installPackage(): void {
		this.logger.info(`Installing...`)

		try {
			const out = execSync(this.options.scripts.install)
			this.logger.info(`Install stdout:`, out.toString())
			this.storage.setItem(`setupPhase`, `installed`)
			this.logger.info(`Installed!`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				this.logger.error(`Failed to get the latest release: ${thrown.message}`)
			}
			return
		}
	}

	public stopAllServices(): Future<unknown> {
		this.logger.info(`Stopping all services... auto-respawn disabled.`)
		this.autoRespawnDeadServices = false
		for (const [serviceName] of toEntries(this.services)) {
			this.stopService(serviceName)
		}
		return this.dead
	}

	public stopService(serviceName: S): void {
		const service = this.services[serviceName]
		if (service) {
			this.logger.info(`Stopping service "${serviceName}"...`)
			this.servicesDead[this.serviceIdx[serviceName]].use(
				new Promise((pass) => {
					service.emit(`timeToStop`)
					service.process.once(`close`, (exitCode) => {
						this.logger.info(
							`Stopped service "${serviceName}"; exited with code ${exitCode}`,
						)
						this.services[serviceName] = null
						pass()
					})
				}),
			)
			this.dead.use(Promise.all(this.servicesDead))
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
}
