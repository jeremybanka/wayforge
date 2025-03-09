/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
// import fs from "node:fs"
import path from "node:path"

// const mkdirp = require(`make-dir`)
// const supportsColor = require(`supports-color`)

// type RecursiveMap<T> = Map<string, RecursiveMap<T>>
// const virtualDirectoryTree = new Map<string, RecursiveMap<string>>()
// const files = new Map<string, string>()

class VirtualFileTree extends Map<string, VirtualFileTree | string> {
	public mkdirSync(dirPath: string): void {
		const segments = dirPath.split(`/`)
		let currentNode: VirtualFileTree | undefined
		for (const segment of segments) {
			if (!(this ?? currentNode).has(segment)) {
				;(this ?? currentNode).set(segment, new VirtualFileTree())
			}
			const nextNode = this.get(segment)
			if (nextNode instanceof VirtualFileTree) {
				currentNode = nextNode
			} else {
				throw new Error(`Cannot create a directory`)
			}
		}
	}
	public writeFileSync(filePath: string, contents: string): void {
		let currentNode: VirtualFileTree | undefined
		const segments = filePath.split(`/`)
		for (const segment of segments) {
			if (!(currentNode ?? this).has(segment)) {
				;(currentNode ?? this).set(segment, new VirtualFileTree())
			}
			const nextNode = this.get(segment)
			if (nextNode instanceof VirtualFileTree) {
				currentNode = nextNode
			} else {
				if (segment !== segments.at(-1)) {
					throw new Error(`Cannot write to a file`)
				}
			}
		}
		;(currentNode ?? this)?.set(filePath, contents)
	}
	public readFileSync(filePath: string): string {
		let currentNode: VirtualFileTree | undefined
		for (const segment of filePath.split(`/`)) {
			const nextNode = (currentNode ?? this).get(segment)
			if (nextNode instanceof VirtualFileTree) {
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
	public openSync(filePath: string, flags: string): number {
		return 0
	}
}
const vfs = new VirtualFileTree()

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
	public constructor(fd: number) {
		super()

		this.fd = fd
	}

	public write(str) {
		fs.writeSync(this.fd, str)
	}

	public close() {
		fs.closeSync(this.fd)
	}
}

// allow stdout to be captured for tests.
let capture = false
let output = ``

// /**
//  * a content writer that writes to the console
//  * @extends ContentWriter
//  * @constructor
//  */
// class ConsoleWriter extends ContentWriter {
// 	public write(str: string): void {
// 		if (capture) {
// 			output += str
// 		} else {
// 			process.stdout.write(str)
// 		}
// 	}

// public	colorize(str: string, string clazz) {
// 		const colors = {
// 			low: `31;1`,
// 			medium: `33;1`,
// 			high: `32;1`,
// 		}

// 		/* istanbul ignore next: different modes for CI and local */
// 		if (supportsColor.stdout && colors[clazz]) {
// 			return `\u001b[${colors[clazz]}m${str}\u001b[0m`
// 		}
// 		return str
// 	}
// }

/**
 * utility for writing files under a specific directory
 * @class FileWriter
 * @param {String} baseDir the base directory under which files should be written
 * @constructor
 */
class VirtualFileWriter {
	public baseDir: string
	public constructor(baseDir: string) {
		if (!baseDir) {
			throw new Error(`baseDir must be specified`)
		}
		this.baseDir = baseDir
	}

	/**
	 * static helpers for capturing stdout report output;
	 * super useful for tests!
	 */
	public static startCapture(): void {
		capture = true
	}

	public static stopCapture() {
		capture = false
	}

	public static getOutput() {
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
	public writerForDir(subdir: string): VirtualFileWriter {
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
		vfs.mkdirSync(path.dirname(dest))
		let contents: string
		if (header) {
			contents = header + vfs.readFileSync(source)
		} else {
			contents = vfs.readFileSync(source)
		}
		vfs.writeFileSync(dest, contents)
	}

	/**
	 * returns a content writer for writing content to the supplied file.
	 * @param {String|null} file the relative path to the file or the special
	 *  values `"-"` or `null` for writing to the console
	 * @returns {ContentWriter}
	 */
	writeFile(file) {
		if (file === null || file === `-`) {
			return new ConsoleWriter()
		}
		if (path.isAbsolute(file)) {
			throw new Error(`Cannot write to absolute path: ${file}`)
		}
		file = path.resolve(this.baseDir, file)
		vfs.mkdirSync(path.dirname(file))
		return new FileContentWriter(fs.openSync(file, `w`))
	}
}

module.exports = VirtualFileWriter
