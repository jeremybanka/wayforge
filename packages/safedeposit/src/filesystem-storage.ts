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
	eagerInit?: boolean
}

export class FilesystemStorage<
	T extends Record<string, string> = Record<string, string>,
> implements Storage
{
	public rootDir: string
	public get initialized(): boolean {
		return existsSync(this.rootDir)
	}
	public initialize(): void {
		if (!this.initialized) {
			mkdirSync(this.rootDir, { recursive: true })
		}
	}

	public constructor(options: FilesystemStorageOptions) {
		this.rootDir = options.path
		if (options.eagerInit) {
			this.initialize()
		}
	}

	public getItem<K extends string & keyof T>(key: K): T[K] | null {
		const filePath = resolve(this.rootDir, key)
		if (existsSync(filePath)) {
			return readFileSync(filePath, `utf-8`) as T[K]
		}
		return null
	}

	public setItem<K extends string & keyof T>(key: K, value: T[K]): void {
		this.initialize()
		const filePath = resolve(this.rootDir, key)
		writeFileSync(filePath, value)
	}

	public removeItem<K extends string & keyof T>(key: K): void {
		const filePath = resolve(this.rootDir, key)
		if (existsSync(filePath)) {
			this.initialize()
			rmSync(filePath)
		}
	}

	public key(index: number): (string & keyof T) | null {
		const filePaths = readdirSync(this.rootDir)
		const filePathsByDateCreated = filePaths.sort((a, b) => {
			const aStat = statSync(a)
			const bStat = statSync(b)
			return bStat.ctimeMs - aStat.ctimeMs
		})
		return (filePathsByDateCreated[index] as string & keyof T) ?? null
	}

	public clear(): void {
		rmSync(this.rootDir, { recursive: true })
		mkdirSync(this.rootDir, { recursive: true })
	}

	public get length(): number {
		return readdirSync(this.rootDir).length
	}
}
