import { sprawl } from "atom.io/introspection"

import { delve, tweak } from "../object"
import { deepMob } from "../object/deepMob"
import { isJsonSchemaRef } from "./refs"

export const dereference = <T extends Array<any> | { [key: PropertyKey]: any }>(
	input: T,
): T => {
	const result: T = deepMob(input)
	sprawl(result, (path, node) => {
		if (path.length === 0) return
		// console.log({ path, node })
		if (path.at(-1) === `$ref` && typeof node === `string`) return
		tweak(result, path, node)
		if (isJsonSchemaRef(node)) {
			const ref = node.$ref
			// console.log({ ref })
			const [_, ...refPath] = ref.split(`/`)
			const refNode = delve(result, refPath)
			// console.log({ refPath, refNode })
			if (!(refNode instanceof Error)) {
				tweak(result, path, refNode.found)
			}
			// console.log({ result })
		}
	})
	return result
}
