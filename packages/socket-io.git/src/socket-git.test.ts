import * as fs from "node:fs"

import { redact } from "anvl/object"
import { ensureAgainst } from "anvl/refinement"
import { pipe } from "fp-ts/function"
import git from "simple-git"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import tmp from "tmp"
import { vitest } from "vitest"

import { isGitSocketError } from "./interface"
import type { GitClientSocket } from "./socket-git-atom-client"
import { serveSimpleGit } from "./socket-git-node"

const PORT = 2452

vitest.spyOn(console, `info`)

const tmpDir = tmp.dirSync({ unsafeCleanup: true })
afterAll(tmpDir.removeCallback)

beforeAll(
	() =>
		pipe(
			new WebSocketServer(PORT),
			serveSimpleGit({
				logger: console,
				git: git({ baseDir: tmpDir.name }),
			}),
		).close,
)

describe(`git-io usage`, () => {
	const client: GitClientSocket = io(`http://localhost:${PORT}/`)

	beforeEach(() => {
		client.removeAllListeners()
	})

	it(
		`fails to report status before initialization`,
		async () =>
			new Promise<void>((pass, fail) =>
				client
					.on(`status`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(client.id, `status`)
							expect(isGitSocketError(result))
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`status`),
			),
		1000,
	)

	it(
		`initializes git`,
		() =>
			new Promise<void>((pass, fail) =>
				client
					.on(`init`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(client.id, `init`)
							expect(
								pipe(
									result,
									ensureAgainst(isGitSocketError),
									redact(`gitDir` /* this is specific to runner OS */),
								),
							).toStrictEqual({
								bare: false,
								existing: false,
								path: tmpDir.name,
							})
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`init`),
			),
		1000,
	)

	it(
		`reports clean status`,
		async () =>
			new Promise<void>((pass, fail) =>
				client
					.on(`status`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(client.id, `status`)
							expect(result).toStrictEqual({
								current: `main`,
								tracking: null,
								detached: false,
								ahead: 0,
								behind: 0,
								created: [],
								deleted: [],
								modified: [],
								conflicted: [],
								files: [],
								not_added: [],
								renamed: [],
								staged: [],
							})
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`status`),
			),
		1000,
	)

	it(
		`reports dirty status`,
		async () =>
			new Promise<void>((pass, fail) => {
				fs.writeFileSync(`${tmpDir.name}/README.md`, `# Hello, World!`)
				client
					.on(`status`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(client.id, `status`)
							expect(result).toStrictEqual({
								current: `main`,
								tracking: null,
								detached: false,
								ahead: 0,
								behind: 0,
								created: [],
								deleted: [],
								modified: [],
								conflicted: [],
								files: [
									{
										path: `README.md`,
										index: `?`,
										working_dir: `?`,
									},
								],
								not_added: [`README.md`],
								renamed: [],
								staged: [],
							})
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`status`)
			}),
		1000,
	)

	it(
		`adds file`,
		async () =>
			new Promise<void>((pass, fail) =>
				client
					.on(`add`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(
								client.id,
								`add`,
								`README.md`,
							)
							expect(
								pipe(result, ensureAgainst(isGitSocketError)),
							).toStrictEqual(``)
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`add`, `README.md`),
			),
		1000,
	)

	it(
		`commits file`,
		async () =>
			new Promise<void>((pass, fail) =>
				client
					.on(`commit`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(
								client.id,
								`commit`,
								`📝 Add README.md`,
							)
							expect(
								pipe(
									result,
									ensureAgainst(isGitSocketError),
									redact(`commit` /* this is timing-based */),
								),
							).toStrictEqual({
								author: null,
								branch: `main`,
								root: true,
								summary: {
									changes: 1,
									deletions: 0,
									insertions: 1,
								},
							})
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`commit`, `📝 Add README.md`),
			),
		1000,
	)

	it(
		`reports diff`,
		async () =>
			new Promise<void>((pass, fail) =>
				client
					.on(`diff`, (result) => {
						try {
							expect(console.info).toHaveBeenCalledWith(client.id, `diff`)
							expect(result).toStrictEqual(``)
						} catch (caught) {
							fail(caught)
						}
						pass()
					})
					.emit(`diff`),
			),
		1000,
	)
})
