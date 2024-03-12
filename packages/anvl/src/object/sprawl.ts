import { isPlainObject } from "./refinement"

// if you found what you were looking for, return true and break
export type InspectionResult = Partial<{
	pathComplete: true
	jobComplete: true
}>
export type InspectNode = (
	path: string[],
	node: unknown,
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => InspectionResult | void

export const sprawl = (
	tree: Array<unknown> | object,
	inspector: InspectNode,
): void => {
	const walk = (p: string[], n: unknown): InspectionResult => {
		const inspect = (path: string[], node: unknown): InspectionResult | null => {
			// console.log(parent)
			const result = inspector(path, node)
			if (result) return result
			return null
		}
		const result = inspect(p, n)
		if (result?.jobComplete ?? result?.pathComplete) {
			return result
		}
		const childEntries = Array.isArray(n)
			? n.map((v, i) => [i, v])
			: isPlainObject(n)
			  ? Object.entries(n)
			  : []
		for (const [k, v] of childEntries) {
			const subResult = walk([...p, k], v)
			if (subResult?.jobComplete) {
				return subResult
			}
		}
		return {}
	}
	walk([], tree)
}
