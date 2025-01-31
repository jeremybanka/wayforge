import * as tmp from "tmp"

import { FilesystemStorage } from "../src/filesystem-storage"

let tmpDir: tmp.DirResult

beforeEach(() => {
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

afterEach(() => {
	tmpDir.removeCallback()
})

describe(`FilesystemStorage`, () => {
	test(`getItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		expect(storage.getItem(`test`)).toBe(null)
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
	})
	test(`setItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
	})
	test(`removeItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
		storage.removeItem(`test`)
		expect(storage.getItem(`test`)).toBe(null)
		try {
			storage.removeItem(`test`)
		} catch (error) {
			if (!(error instanceof Error)) {
				throw error
			}
			expect(error.message).toBe(
				`ENOENT: no such file or directory, remove '${tmpDir.name}/test'`,
			)
		}
	})
	test(`key`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		storage.setItem(`test`, `value`)
		expect(storage.key(0)).toBe(`test`)
		expect(storage.key(1)).toBe(null)
	})
	test(`clear`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
		storage.clear()
		expect(storage.getItem(`test`)).toBe(null)
	})
	test(`length`, () => {
		const storage = new FilesystemStorage({ path: tmpDir.name })
		expect(storage.length).toBe(0)
		storage.setItem(`test`, `value`)
		expect(storage.length).toBe(1)
	})
})
