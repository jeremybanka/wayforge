import { existsSync, mkdirSync, renameSync } from "node:fs"
import { homedir } from "node:os"
import { resolve } from "node:path"

import { $, spawn } from "bun"
import { serve, type Server, type Subprocess } from "bun"

import * as Internal from "./internal"

export * from "./start"
export { Internal }

export const SERVICES_DIR = resolve(homedir(), `services`)
export const UPDATES_DIR = resolve(homedir(), `services/.updates`)
export const BACKUPS_DIR = resolve(homedir(), `services/.backups`)

export type ServiceRef = {
	process: Subprocess | null
}

export type RestartRef = {
	restartTimes: number[]
}

export class ServiceManager {
	public get serviceName(): string {
		return `${this.repo}/${this.app}`
	}

	protected webhookServer: Server
	protected service: Subprocess | null = null
	protected restartTimes: number[] = []

	public readonly currentServiceDir: string
	public readonly updateServiceDir: string
	public readonly backupServiceDir: string

	public constructor(
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
		public readonly mockRetrieveService?: (destination: string) => Promise<void>,
	) {
		this.currentServiceDir = resolve(this.serviceDir, `current`)
		this.backupServiceDir = resolve(this.serviceDir, `backup`)
		this.updateServiceDir = resolve(this.serviceDir, `update`)

		for (const dir of [
			this.currentServiceDir,
			this.updateServiceDir,
			this.backupServiceDir,
		]) {
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true })
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const manager = this

		this.webhookServer = serve({
			port: 8080,
			async fetch(request: Request): Promise<Response> {
				try {
					let response: Response
					switch (request.method) {
						case `POST`:
							{
								const webhook = await request.json()
								if (webhook.action === `published`) {
									response = new Response(null, { status: 200 })
									await Internal.fetchLatestRelease(UPDATES_DIR, repo, app)
									if (manager.service) {
										manager.service.send(`updates are ready!`)
									} else {
										manager.applyUpdate()
										manager.startService()
									}
									response = new Response(null, { status: 200 })
								} else {
									throw 404
								}
							}
							break
						default:
							throw 405
					}
					return response
				} catch (thrown) {
					if (typeof thrown === `number`) {
						const status = thrown
						return new Response(null, { status })
					}
					console.error(thrown)
					return new Response(null, { status: 500 })
				}
			},
		})

		void this.fetchLatestRelease().then(async () => {
			console.log(
				`0 current:`,
				(await $`ls ${this.currentServiceDir}`).stdout.toString(),
			)
			console.log(
				`0 update:`,
				(await $`ls ${this.updateServiceDir}`).stdout.toString(),
			)
			this.applyUpdate()
			console.log(
				`1 current:`,
				(await $`ls ${this.currentServiceDir}`).stdout.toString(),
			)
			// console.log(`1 update:`, (await $`ls ${this.updateServiceDir}`).stdout)
			this.startService()
		})
	}

	protected async startService(): void {
		if (!existsSync(this.currentServiceDir)) {
			console.log(
				`Tried to start service but failed: Service ${this.serviceName} is not yet installed.`,
			)
		}

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const manager = this
		await $`PATH=$PATH:${this.currentServiceDir}`

		console.log((await $`echo $PATH`).stdout.toString())
		this.service = spawn(this.runCmd, {
			cwd: this.currentServiceDir,
			env: import.meta.env,
			onExit(_, exitCode) {
				console.log(
					`Service ${manager.serviceName} exited with code ${exitCode}`,
				)
				manager.service = null
				if (exitCode !== 0) {
					const now = Date.now()
					const fiveMinutesAgo = now - 5 * 60 * 1000
					manager.restartTimes = manager.restartTimes.filter(
						(time) => time > fiveMinutesAgo,
					)
					manager.restartTimes.push(now)

					if (manager.restartTimes.length < 5) {
						console.log(`Service ${manager.serviceName} crashed. Restarting...`)
						manager.startService()
					} else {
						console.log(
							`Service ${manager.serviceName} crashed too many times. Not restarting.`,
						)
					}
				}
			},
			async ipc(message) {
				if (message === `ready to update!` && manager.service) {
					manager.service.kill()
					await manager.service.exited
					manager.service = null
					manager.applyUpdate()
					manager.startService()
				}
			},
		})
	}

	protected applyUpdate(): void {
		console.log(`Updating service ${this.serviceName}...`)

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
		if (this.mockRetrieveService) {
			await this.mockRetrieveService(this.updateServiceDir)
			return
		}
		try {
			const assetUrl =
				await $`gh release view --repo ${this.repo} --json tagName,assets --jq '.assets[] | select(.name | test("${this.app}")) | .url'`
			if (!assetUrl) {
				console.log(`No matching release found for ${this.serviceName}.`)
				return
			}

			if (!existsSync(this.currentServiceDir)) {
				mkdirSync(this.currentServiceDir, { recursive: true })
			}

			console.log(`Downloading release for ${this.serviceName}...`)

			await $`gh release download --repo ${this.repo} --dir ${this.currentServiceDir} --pattern "*${this.app}*"`

			return
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(`Failed to fetch the latest release: ${thrown.message}`)
			}
			return
		}
	}
}
