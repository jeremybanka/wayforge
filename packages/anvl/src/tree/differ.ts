import { sprawl } from "../object"
import type { Refinery, Supported } from "../refinement/refinery"
import { discoverType } from "../refinement/refinery"

export function diffNumber(a: number, b: number): Delta {
	const sign = a < b ? `+` : `-`
	return {
		summary: `${sign}${Math.abs(a - b)} (${a} → ${b})`,
	}
}

export function diffString(a: string, b: string): Delta {
	const sign = a.length < b.length ? `+` : `-`
	return {
		summary: `${sign}${Math.abs(a.length - b.length)} ("${a}" → "${b}")`,
	}
}

export function diffBoolean(a: boolean, b: boolean): Delta {
	return {
		summary: `${a} → ${b}`,
	}
}

export function diffObject(
	a: Record<string, unknown>,
	b: Record<string, unknown>,
	recurse: Differ<any, any>[`diff`],
): Delta {
	let summary = ``
	const added: Delta[`added`] = []
	const removed: Delta[`removed`] = []
	const changed: Delta[`changed`] = []

	sprawl(a, (path, nodeA) => {
		let key: string
		for (key of path) {
			const nodeB = b[key]
			if (nodeB === undefined) {
				removed.push([key, JSON.stringify(nodeA)])
			} else {
				const delta = recurse(nodeA, nodeB)
				if (delta.summary !== `No Change`) {
					changed.push([key, delta])
				}
			}
		}
	})

	sprawl(b, (path, nodeB) => {
		let key: string
		for (key of path) {
			const nodeA = a[key]
			if (nodeA === undefined) {
				added.push([key, JSON.stringify(nodeB)])
			}
		}
	})

	summary = `～${changed.length} ＋${added.length} －${removed.length}`

	return {
		summary,
		added,
		removed,
		changed,
	}
}

export function diffArray(
	a: unknown[],
	b: unknown[],
	recurse: Differ<any, any>[`diff`],
): Delta {
	return diffObject(a as any, b as any, recurse)
}

type Delta = {
	summary: string
	added?: [path: string, addedStringifiedValue: string][]
	removed?: [path: string, removedStringifiedValue: string][]
	changed?: [path: string, delta: Delta][]
}

type Diff<T> = (a: T, b: T) => Delta
type DiffTree<T> = (a: T, b: T, recurse: Differ<any, any>[`diff`]) => Delta

export class Differ<
	Leaf extends Record<string, any>,
	Tree extends Record<string, any>,
> {
	public leafRefinery: Refinery<Leaf>
	public treeRefinery: Refinery<Tree>
	public leafDiffers: { [K in keyof Leaf]: Diff<Supported<Leaf[K]>> }
	public treeDiffers: { [K in keyof Tree]: DiffTree<Supported<Tree[K]>> }

	public constructor(
		leafRefinery: Refinery<Leaf>,
		treeRefinery: Refinery<Tree>,
		diffFunctions: {
			[K in keyof Tree]: DiffTree<Supported<Tree[K]>>
		} & { [K in keyof Leaf]: Diff<Supported<Leaf[K]>> },
	) {
		this.leafRefinery = leafRefinery
		this.treeRefinery = treeRefinery
		this.leafDiffers = {} as any
		this.treeDiffers = {} as any
		for (const key of Object.keys(leafRefinery.supported)) {
			const diffFunction = diffFunctions[key]
			this.leafDiffers[key as keyof Leaf] = diffFunction
		}
		for (const key of Object.keys(treeRefinery.supported)) {
			const diffFunction = diffFunctions[key]
			this.treeDiffers[key as keyof Tree] = diffFunction
		}
	}

	public diff(a: unknown, b: unknown): Delta {
		if (a === b) {
			return { summary: `No Change` }
		}
		try {
			if (JSON.stringify(a) === JSON.stringify(b)) {
				return { summary: `No Change` }
			}
		} catch (thrown) {
			console.error(`Error stringifying`, a, b)
		}

		const aRefined = this.leafRefinery.refine(a) ?? this.treeRefinery.refine(a)
		const bRefined = this.leafRefinery.refine(b) ?? this.treeRefinery.refine(b)

		// console.log({ leaf: this.leafRefinery, tree: this.treeRefinery })
		// console.log({ a, b })
		// console.log({ aRefined, bRefined })

		if (aRefined !== null && bRefined !== null) {
			if (aRefined.type === bRefined.type) {
				if (aRefined.type in this.leafDiffers) {
					const delta = this.leafDiffers[aRefined.type](
						aRefined.data,
						bRefined.data,
					)
					return delta
				}
				if (aRefined.type in this.treeDiffers) {
					const delta = this.treeDiffers[aRefined.type](
						aRefined.data,
						bRefined.data,
						(x, y) => this.diff(x, y),
					)
					return delta
				}
			}
		}
		const typeA = discoverType(a)
		const typeB = discoverType(b)
		if (typeA === typeB) {
			return {
				summary: `${typeA} → ${typeB}`,
			}
		}
		return {
			summary: `Type change: ${typeA} → ${typeB}`,
		}
	}
}
