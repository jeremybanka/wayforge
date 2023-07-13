import { key } from "./access"
import { isPlainObject } from "./refinement"
import { sprawl } from "./sprawl"

export type Fragment<T> = Partial<{
	[K in keyof T]: T[K] extends (infer Item)[]
		? Fragment<Item>[]
		: Fragment<Partial<T[K]>>
}>

interface ExampleTree extends Record<keyof any, any> {
	a?: {
		b: {
			c: number | null
		}[]
	}
	z: number
}

type ExampleFragment = Fragment<ExampleTree>

const exampleTreeFragment: ExampleFragment = { a: { b: [{}] } }

export const patch = <Base extends object, Update extends Fragment<Base>>(
	base: Base,
	update: Update,
): Base => {
	const result = { ...base }
	sprawl(update, (path, node) => {
		if (path.length === 0) return
		const target = path.reduce((acc, part) => key(part)(acc), result)
		if (Array.isArray(target) && Array.isArray(node)) {
			target.push(...node)
		}
		if (isPlainObject(target) && isPlainObject(node)) {
			Object.assign(target, node)
		}
	})
	return result
}
