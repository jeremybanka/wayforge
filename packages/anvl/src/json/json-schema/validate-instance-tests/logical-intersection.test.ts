import { select } from "../../../object"
import { Int } from "../integer"
import type {
  IntegerSchema,
  IntersectionSchema,
  NumberSchema,
} from "../json-schema"
import { validateBy } from "../validate-instance"

const integerFrom2To8: IntegerSchema = {
  type: `integer`,
  maximum: Int(8),
  minimum: Int(2),
}
const number123: NumberSchema = {
  type: `number`,
  enum: [1, 2, 3],
}
const SCHEMA: IntersectionSchema = {
  allOf: [integerFrom2To8, number123],
}
const validate = validateBy(SCHEMA)

describe(`intersection validation`, () => {
  it(`does not pass an instance that fails against one option`, () => {
    const instance = Int(4)
    expect(validate(instance)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            allOf: [select(`enum`)(number123)],
          },
        },
      ],
    })
  })
  it(`validates an instance that validates against more than one option`, () => {
    const instance = Int(2)
    expect(validate(instance)).toStrictEqual({ isValid: true, violations: [] })
  })
  it(`does not validate an instance that fails to validate against any given options`, () => {
    const instance = Int(9)
    expect(validate(instance)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            allOf: [
              select(`maximum`)(integerFrom2To8),
              select(`enum`)(number123),
            ],
          },
        },
      ],
    })
  })
})
