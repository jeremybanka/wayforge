import { isJsonSchema } from "./json-schema"
import { expandPathForSchema } from "./path-into"
import type { ReffedJsonSchema } from "./refs"
import { isJsonSchemaRef, retrieveRef } from "./refs"

export const findSubSchema = (
	schema: ReffedJsonSchema,
): ((
	path: (number | string)[] | ReadonlyArray<number | string>,
) => Error | ReffedJsonSchema) => {
	if (typeof schema === `boolean`) {
		throw new Error(`The schema does not contain subSchemas`)
	}
	return (path: string[]) => {
		const pathIntoSchema = expandPathForSchema(path)
		if (pathIntoSchema instanceof Error) return pathIntoSchema
		if (typeof schema === `boolean`) {
			return new TypeError(`The schema is not a JsonSchema`)
		}
		const reduction = pathIntoSchema.reduce(
			({ node, refMap = undefined }, key) => (
				console.log({ node, key }),
				isJsonSchemaRef(node)
					? retrieveRef({ refNode: node, root: schema, refMap })
					: { node: node[key], refMap }
			),
			{ node: schema, refMap: undefined },
		)
		const { node, refMap } = reduction
		if (node instanceof Error) throw node

		let subSchema = node
		while (isJsonSchemaRef(subSchema)) {
			console.log({ subSchema })
			subSchema = retrieveRef({ refNode: subSchema, root: schema, refMap }).node
		}
		console.log({ subSchema })

		if (isJsonSchema(subSchema)) {
			return subSchema
		}
		throw new TypeError(`The subSchema is not a JsonSchema`)
	}
}
