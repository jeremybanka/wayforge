import { select } from "../../../object"
import { Int } from "../integer"
import type { IntegerSchema } from "../json-schema"
import { validateBy } from "../validate-instance"

describe(`minimum and maximum`, () => {
  const integerFrom2To8: IntegerSchema = {
    type: `integer`,
    maximum: Int(8),
    minimum: Int(2),
  }
  const validate = validateBy(integerFrom2To8)

  it(`accepts integers included within`, () => {
    const instance = Int(8)
    const expected = { isValid: true, violations: [] }
    expect(validate(instance)).toStrictEqual(expected)
  })
  it(`rejects integers lower than the range`, () => {
    const instance = Int(1)
    const expected = {
      isValid: false,
      violations: [
        {
          instance,
          schema: select(`minimum`)(integerFrom2To8),
        },
      ],
    }
    expect(validate(instance)).toStrictEqual(expected)
  })
  it(`rejects integers higher than the range`, () => {
    const instance = Int(9)
    const expected = {
      isValid: false,
      violations: [
        {
          instance,
          schema: select(`maximum`)(integerFrom2To8),
        },
      ],
    }
    expect(validate(instance)).toStrictEqual(expected)
  })
})
