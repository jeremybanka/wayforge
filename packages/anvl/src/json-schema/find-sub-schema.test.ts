import { findSubSchema } from "./find-sub-schema"
import type { JsonSchema } from "./json-schema"
import type { ReffedJsonSchema } from "./refs"

describe(`findSubSchema`, () => {
	it(`should find a subSchema`, () => {
		const schema: JsonSchema = {
			type: `object`,
			properties: {
				a: { type: `string` },
				b: { type: `number` },
			},
		}
		const find = findSubSchema(schema)
		const result = find([`a`])
		expect(result).toStrictEqual({ type: `string` })
	})
	it(`handles refs`, () => {
		const schema: ReffedJsonSchema = {
			type: `object`,
			properties: {
				a: { type: `string` },
				b: { $ref: `#/properties/a` },
			},
		} as const
		const find = findSubSchema(schema)
		const result = find([`b`])
		expect(result).toStrictEqual({ type: `string` })
	})
	it(`handles refs to refs`, () => {
		const schema: ReffedJsonSchema = {
			type: `object`,
			properties: {
				a: { type: `string` },
				b: { $ref: `#/properties/a` },
				c: { $ref: `#/properties/b` },
			},
		} as const
		const find = findSubSchema(schema)
		const result = find([`c`])
		expect(result).toStrictEqual({ type: `string` })
	})
})
