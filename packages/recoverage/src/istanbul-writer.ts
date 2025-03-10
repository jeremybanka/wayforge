/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
import path from "node:path"

class TreeMap<K, V> extends Map<K, TreeMap<K, V> | V> {}

class VirtualFileSystem extends TreeMap<string, string> {
	// Track the next file descriptor to assign
	private nextFd = 1
	// Store open files with their descriptors and metadata
	private openFiles: Map<
		number,
		{ path: string; flag: string; position: number; appendMode: boolean }
	> = new Map()
	private tree: TreeMap<string, string>

	// Existing methods (with assumed correction in writeFileSync)
	public mkdirSync(dirPath: string): void {
		const segments = dirPath.split(`/`).filter((s) => s !== ``)
		let currentNode: TreeMap<string, string> | undefined
		for (const segment of segments) {
			if (!(currentNode ?? this).has(segment)) {
				;(currentNode ?? this).set(segment, new TreeMap())
			}
			const nextNode = (currentNode ?? this).get(segment) // Fixed from this.get(segment)
			if (nextNode instanceof TreeMap) {
				currentNode = nextNode
			} else {
				console.error({
					currentNode,
					nextNode,
					segments,
					dirPath,
				})
				throw new Error(`Cannot create a directory...`)
			}
		}
	}

	public writeFileSync(filePath: string, contents: string): void {
		let currentNode: TreeMap<string, string> | undefined
		const segments = filePath.split(`/`).filter((s) => s !== ``)
		for (const segment of segments.slice(0, -1)) {
			// Up to parent directory
			if (!(currentNode ?? this).has(segment)) {
				;(currentNode ?? this).set(segment, new TreeMap())
			}
			const nextNode = (currentNode ?? this).get(segment)
			if (nextNode instanceof TreeMap) {
				currentNode = nextNode
			} else {
				throw new Error(`Cannot write to a file`)
			}
		}
		// Set the last segment (filename) to contents, fixing the original bug
		;(currentNode ?? this).set(segments[segments.length - 1], contents)
	}

	public readFileSync(filePath: string): string {
		let currentNode: TreeMap<string, string> | undefined
		for (const segment of filePath.split(`/`)) {
			const nextNode = (currentNode ?? this).get(segment)
			if (nextNode instanceof TreeMap) {
				currentNode = nextNode
			} else {
				if (segment !== filePath.split(`/`).at(-1)) {
					throw new Error(`Cannot read a file`)
				}
				if (typeof nextNode === `string`) {
					return nextNode
				}
			}
		}
		throw new Error(`File not found`)
	}

	public openSync(filePath: string, flag: string): number {
		const segments = filePath.split(`/`).filter((s) => s !== ``)
		let currentNode: TreeMap<string, string> | undefined

		// Traverse to the parent directory
		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i]
			const nextNode = (currentNode ?? this).get(segment)
			if (!(nextNode instanceof TreeMap)) {
				throw new Error(
					`Directory not found: ${segments.slice(0, i + 1).join(`/`)}`,
				)
			}
			currentNode = nextNode
		}

		const fileName = segments[segments.length - 1]
		let fileContent = (currentNode ?? this).get(fileName)

		// Check if the path is a directory
		if (fileContent instanceof TreeMap) {
			throw new Error(`Is a directory: ${filePath}`)
		}

		const fileExists = typeof fileContent === `string`

		// Handle flags
		if (flag === `r` || flag === `r+`) {
			if (!fileExists) {
				throw new Error(`File not found: ${filePath}`)
			}
		} else if (flag === `w` || flag === `w+` || flag === `a` || flag === `a+`) {
			if (!fileExists) {
				;(currentNode ?? this).set(fileName, ``)
				fileContent = ``
			} else if (flag === `w` || flag === `w+`) {
				;(currentNode ?? this).set(fileName, ``) // Truncate file
				fileContent = ``
			}
			// For 'a' or 'a+', keep existing content
		} else {
			throw new Error(`Unsupported flag: ${flag}`)
		}

		// Assign file descriptor and store metadata
		const fd = this.nextFd++
		const appendMode = flag === `a` || flag === `a+`
		const initialPosition = appendMode ? (fileContent as string).length : 0
		this.openFiles.set(fd, {
			path: filePath,
			flag,
			position: initialPosition,
			appendMode,
		})

		return fd
	}

	public closeSync(fd: number): void {
		if (!this.openFiles.has(fd)) {
			throw new Error(`Bad file descriptor: ${fd}`)
		}
		this.openFiles.delete(fd)
	}

	public writeSync(fd: number, data: string, position?: number): number {
		if (!this.openFiles.has(fd)) {
			throw new Error(`Bad file descriptor: ${fd}`)
		}

		const {
			path: filePath,
			flag,
			position: currentPosition,
			appendMode,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
		} = this.openFiles.get(fd)!

		// Check if writing is allowed
		if (flag === `r`) {
			throw new Error(`File not open for writing: ${filePath}`)
		}

		// Traverse to the file
		const segments = filePath.split(`/`).filter((s) => s !== ``)
		let currentNode: TreeMap<string, string> | undefined
		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i]
			const nextNode = (currentNode ?? this).get(segment)
			if (!(nextNode instanceof TreeMap)) {
				throw new Error(
					`Directory not found: ${segments.slice(0, i + 1).join(`/`)}`,
				)
			}
			currentNode = nextNode
		}

		const fileName = segments[segments.length - 1]
		let fileContent = (currentNode ?? this).get(fileName)
		if (fileContent instanceof TreeMap) {
			throw new Error(`Is a directory: ${filePath}`)
		}
		if (typeof fileContent !== `string`) {
			throw new Error(`File not found: ${filePath}`)
		}

		// Determine where to write
		let writePosition: number
		if (appendMode) {
			writePosition = fileContent.length // Always append
		} else if (position !== undefined) {
			writePosition = position // Use specified position
		} else {
			writePosition = currentPosition // Use current position
		}

		// Perform the write
		if (writePosition > fileContent.length) {
			fileContent += `\0`.repeat(writePosition - fileContent.length) // Pad with nulls
		}
		fileContent =
			fileContent.slice(0, writePosition) +
			data +
			fileContent.slice(writePosition + data.length)
		;(currentNode ?? this).set(fileName, fileContent)

		// Update position if not in append mode and no position was specified
		if (!appendMode && position === undefined) {
			const newPosition = writePosition + data.length
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			this.openFiles.get(fd)!.position = newPosition
		}

		return data.length
	}
}

/**
 * Base class for writing content
 * @class ContentWriter
 * @constructor
 */
abstract class ContentWriter {
	/**
	 * returns the colorized version of a string. Typically,
	 * content writers that write to files will return the
	 * same string and ones writing to a tty will wrap it in
	 * appropriate escape sequences.
	 * @param {String} str the string to colorize
	 * @param {String} clazz one of `high`, `medium` or `low`
	 * @returns {String} the colorized form of the string
	 */
	public colorize(str: string /*, clazz*/): string {
		return str
	}

	public abstract write(str: string): void

	/**
	 * writes a string appended with a newline to the destination
	 * @param {String} str the string to write
	 */
	public println(str: string): void {
		this.write(`${str}\n`)
	}

	/**
	 * closes this content writer. Should be called after all writes are complete.
	 */
	public close(): void {}
}

/**
 * a content writer that writes to a file
 * @param {Number} fd - the file descriptor
 * @extends ContentWriter
 * @constructor
 */
class FileContentWriter extends ContentWriter {
	public fd: number
	public vfs: VirtualFileSystem
	public constructor(fd: number, vfs: VirtualFileSystem) {
		super()

		this.fd = fd
		this.vfs = vfs
	}

	public write(str) {
		this.vfs.writeSync(this.fd, str)
	}

	public close() {
		this.vfs.closeSync(this.fd)
	}
}

// allow stdout to be captured for tests.
let capture = false
let output = ``

/**
 * utility for writing files under a specific directory
 * @class FileWriter
 * @param {String} baseDir the base directory under which files should be written
 * @constructor
 */
export class VirtualFileWriter {
	public baseDir: string
	public vfs: VirtualFileSystem
	public constructor(baseDir: string, vfs = new VirtualFileSystem()) {
		if (!baseDir) {
			throw new Error(`baseDir must be specified`)
		}
		this.baseDir = baseDir
		this.vfs = vfs
	}

	/**
	 * static helpers for capturing stdout report output;
	 * super useful for tests!
	 */
	public static startCapture(): void {
		capture = true
	}

	public static stopCapture(): void {
		capture = false
	}

	public static getOutput(): string {
		return output
	}

	public static resetOutput(): void {
		output = ``
	}

	/**
	 * returns a FileWriter that is rooted at the supplied subdirectory
	 * @param {String} subdir the subdirectory under which to root the
	 *  returned FileWriter
	 * @returns {VirtualFileWriter}
	 */
	public writeForDir(subdir: string): VirtualFileWriter {
		if (path.isAbsolute(subdir)) {
			throw new Error(`Cannot create subdir writer for absolute path: ${subdir}`)
		}
		return new VirtualFileWriter(`${this.baseDir}/${subdir}`)
	}

	/**
	 * copies a file from a source directory to a destination name
	 * @param {String} source path to source file
	 * @param {String} dest relative path to destination file
	 * @param {String} [header=undefined] optional text to prepend to destination
	 *  (e.g., an "this file is autogenerated" comment, copyright notice, etc.)
	 */
	public copyFile(source: string, dest: string, header?: string): void {
		if (path.isAbsolute(dest)) {
			throw new Error(`Cannot write to absolute path: ${dest}`)
		}
		dest = path.resolve(this.baseDir, dest)
		this.vfs.mkdirSync(path.dirname(dest))
		let contents: string
		if (header) {
			contents = header + this.vfs.readFileSync(source)
		} else {
			contents = this.vfs.readFileSync(source)
		}
		this.vfs.writeFileSync(dest, contents)
	}

	/**
	 * returns a content writer for writing content to the supplied file.
	 * @param {String|null} file the relative path to the file or the special
	 *  values `"-"` or `null` for writing to the console
	 * @returns {ContentWriter}
	 */
	public writeFile(file: string): ContentWriter {
		// if (file === null || file === `-`) {
		// 	return new ConsoleWriter()
		// }
		if (path.isAbsolute(file)) {
			throw new Error(`Cannot write to absolute path: ${file}`)
		}
		file = path.resolve(this.baseDir, file)
		this.vfs.mkdirSync(path.dirname(file))
		return new FileContentWriter(this.vfs.openSync(file, `w`), this.vfs)
	}
}
