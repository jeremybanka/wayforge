import { diffLines } from "diff"
import picocolors from "picocolors"
import type { Colors } from "picocolors/types"

export const pico: Colors = picocolors.createColors(true)

export function prettyPrintDiff(oldStr: string, newStr: string): string {
	const diff = diffLines(oldStr, newStr)

	return diff
		.map((part) => {
			if (part.added) {
				return pico.green(part.value) // Added text
			}
			if (part.removed) {
				return pico.red(part.value) // Removed text
			}
			return part.value // Unchanged text
		})
		.join(``)
}
