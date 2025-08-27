import { eldest, type Lineage, newest } from "atom.io/internal"

describe(`lineage`, () => {
	test(`navigate a chain of 'scions' from eldest to newest`, () => {
		class Example implements Lineage {
			public parent: ChildExample | RootExample | null
			public child: ChildExample | null = null
			public value: number

			public constructor(
				value: number,
				parent: ChildExample | RootExample | null = null,
			) {
				this.parent = parent
				this.value = value
				if (parent) {
					parent.child = this as ChildExample
				}
			}
		}
		type ChildExample = Example & { parent: RootExample }
		type RootExample = Example & { child: ChildExample; parent: null }

		const grandParent = new Example(1) as RootExample
		const parent = new Example(2, grandParent) as RootExample
		const child = new Example(3, parent)

		expect(eldest(child)).toBe(grandParent)
		expect(eldest(parent)).toBe(grandParent)
		expect(eldest(grandParent)).toBe(grandParent)

		expect(newest(child)).toBe(child)
		expect(newest(parent)).toBe(child)
		expect(newest(grandParent)).toBe(child)
	})
})
