import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { FilesystemStorage } from "../src/filesystem-storage"

let tmpDir: string

beforeEach(() => {
	tmpDir = mkdtempSync(path.join(tmpdir(), `safedeposit-`))
})

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true })
})

describe(`FilesystemStorage`, () => {
	test(`getItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
		expect(storage.getItem(`test`)).toBe(null)
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
	})
	test(`setItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
	})
	test(`removeItem`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
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
				`ENOENT: no such file or directory, remove '${tmpDir}/test'`,
			)
		}
	})
	test(`key`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
		storage.setItem(`test`, `value`)
		expect(storage.key(0)).toBe(`test`)
		expect(storage.key(1)).toBe(null)
	})
	test(`clear`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
		storage.setItem(`test`, `value`)
		expect(storage.getItem(`test`)).toBe(`value`)
		storage.clear()
		expect(storage.getItem(`test`)).toBe(null)
	})
	test(`length`, () => {
		const storage = new FilesystemStorage({ path: tmpDir })
		expect(storage.length).toBe(0)
		storage.setItem(`test`, `value`)
		expect(storage.length).toBe(1)
	})
})
