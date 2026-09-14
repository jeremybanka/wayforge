import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const manager = vi.hoisted(() => ({
	startGlobalTracking: vi.fn(),
	prepareUploads: vi.fn(),
	endGlobalTrackingAndFlushUnusedFiles: vi.fn(),
}))

vi.mock(`../src/varmint-workspace-manager`, () => ({
	varmintWorkspaceManager: manager,
}))

const originalArgv = process.argv

beforeEach(() => {
	vi.resetModules()
	vi.spyOn(console, `log`).mockImplementation(() => {})
})

afterEach(() => {
	process.argv = originalArgv
	vi.restoreAllMocks()
	vi.clearAllMocks()
})

async function runCli(...args: string[]) {
	process.argv = [process.execPath, `varmint`, ...args]
	await import(`../src/varmint.x`)
}

describe(`CLI help`, () => {
	it.each([
		[],
		[`--help`],
		[`-h`],
		[`track`, `--help`],
		[`track`, `-h`],
		[`clean`, `--help`],
		[`clean`, `-h`],
		[`clean`, `--help`, `--ci-flag=CI`],
	])(`shows help without workspace actions for %j`, async (...args) => {
		await runCli(...args)

		expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`USAGE`))
		expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`track`))
		expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`clean`))
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining(`--ci-flag`),
		)
		expect(manager.startGlobalTracking).not.toHaveBeenCalled()
		expect(manager.prepareUploads).not.toHaveBeenCalled()
		expect(manager.endGlobalTrackingAndFlushUnusedFiles).not.toHaveBeenCalled()
	})

	it.each([[], [`--help=false`]])(`still tracks with %j`, async (...args) => {
		await runCli(`track`, ...args)

		expect(manager.startGlobalTracking).toHaveBeenCalledOnce()
		expect(manager.endGlobalTrackingAndFlushUnusedFiles).not.toHaveBeenCalled()
	})

	it(`still prepares uploads and cleans when help is false`, async () => {
		await runCli(`clean`, `--help=false`, `--ci-flag=CI`)

		expect(manager.prepareUploads).toHaveBeenCalledWith(`CI`)
		expect(manager.endGlobalTrackingAndFlushUnusedFiles).toHaveBeenCalledOnce()
		expect(manager.startGlobalTracking).not.toHaveBeenCalled()
	})
})
