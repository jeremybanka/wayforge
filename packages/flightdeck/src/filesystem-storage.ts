import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs"
import { resolve } from "node:path"

export type FilesystemStorageOptions = {
	path: string
}

export class FilesystemStorage implements Storage {
	public rootDir: string

	public constructor(options: FilesystemStorageOptions) {
		this.rootDir = options.path
		if (!existsSync(this.rootDir)) {
			mkdirSync(this.rootDir, { recursive: true })
		}
	}

	public getItem(key: string): string | null {
		const filePath = resolve(this.rootDir, key)
		if (existsSync(filePath)) {
			return readFileSync(filePath, `utf-8`)
		}
		return null
	}

	public setItem(key: string, value: string): void {
		const filePath = resolve(this.rootDir, key)
		writeFileSync(filePath, value)
	}

	public removeItem(key: string): void {
		const filePath = resolve(this.rootDir, key)
		if (existsSync(filePath)) {
			rmSync(filePath)
		}
	}

	public key(index: number): string | null {
		const filePaths = readdirSync(this.rootDir)
		const filePathsByDateCreated = filePaths.sort((a, b) => {
			const aStat = statSync(a)
			const bStat = statSync(b)
			return bStat.ctimeMs - aStat.ctimeMs
		})
		return filePathsByDateCreated[index] ?? null
	}

	public clear(): void {
		rmSync(this.rootDir, { recursive: true })
		mkdirSync(this.rootDir, { recursive: true })
	}

	public get length(): number {
		return readdirSync(this.rootDir).length
	}
}
