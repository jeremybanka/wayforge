import { select } from "../../../object"
import { Int } from "../integer"
import type {
  ExclusiveSchema,
  IntegerSchema,
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
const SCHEMA: ExclusiveSchema = {
  oneOf: [integerFrom2To8, number123],
}
const validate = validateBy(SCHEMA)

describe(`exclusive validation`, () => {
  it(`validates an instance that validates against only one option`, () => {
    const instance = Int(4)
    expect(validate(instance)).toStrictEqual({ isValid: true, violations: [] })
  })
  it(`does not validate an instance that does not validate against any option`, () => {
    const instance = Int(9)
    expect(validate(instance)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          problem: `0 of these 2 schemas were able to validate the instance`,
          schema: {
            oneOf: [
              select(`maximum`)(integerFrom2To8),
              select(`enum`)(number123),
            ],
          },
        },
      ],
    })
  })
  it(`does not validate an instance that validates against more than one option`, () => {
    const instance = Int(2)
    expect(validate(instance)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          problem: `2 of these 2 schemas were able to validate the instance`,
          schema: {
            oneOf: SCHEMA.oneOf,
          },
        },
      ],
    })
  })
})
