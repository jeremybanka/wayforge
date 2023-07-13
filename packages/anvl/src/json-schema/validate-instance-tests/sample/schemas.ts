import { Int } from "../../integer"
import type {
	BooleanSchema,
	IntegerSchema,
	NumberSchema,
} from "../../json-schema"

const integerFrom2To8: IntegerSchema = {
	type: `integer`,
	maximum: Int(8),
	minimum: Int(2),
}
const number123: NumberSchema = {
	type: `number`,
	enum: [1, 2, 3],
}
const onlyTrue: BooleanSchema = {
	type: `boolean`,
	enum: [true],
}

export const SAMPLE_SCHEMAS = {
	integerFrom2To8,
	number123,
	onlyTrue,
}
